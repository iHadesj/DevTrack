import type {
  InternshipEntry,
  StudySession,
  SyncOperation,
  Task,
} from "../interfaces";

/** Nome e versão do banco local. A versão sobe quando a estrutura muda. */
const DATABASE_NAME = "devtrack-offline";
const DATABASE_VERSION = 1;

/** Nomes das tabelas (object stores) do IndexedDB para evitar strings repetidas. */
const STORES = {
  tasks: "tasks",
  studySessions: "studySessions",
  internshipEntries: "internshipEntries",
  syncQueue: "syncQueue",
} as const;

/**
 * Converte a API baseada em eventos do IndexedDB em Promise para podermos usar async/await.
 * Isso deixa o fluxo de leitura e escrita parecido com uma chamada de API comum.
 */
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Falha no IndexedDB."));
  });
}

/** Espera a transação terminar; só então a escrita está realmente persistida no disco. */
function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Transação não concluída."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Transação cancelada."));
  });
}

/**
 * Abre o banco local e cria as tabelas na primeira execução do app.
 * `keyPath: id` diz que cada objeto será identificado pelo próprio campo `id`.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORES.tasks)) {
        database.createObjectStore(STORES.tasks, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(STORES.studySessions)) {
        database.createObjectStore(STORES.studySessions, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(STORES.internshipEntries)) {
        database.createObjectStore(STORES.internshipEntries, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(STORES.syncQueue)) {
        database.createObjectStore(STORES.syncQueue, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ?? new Error("Não foi possível abrir o banco local."),
      );
  });
}

/** Lê todos os registros de uma tabela do IndexedDB. */
async function getAll<T>(storeName: string): Promise<T[]> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const request = transaction.objectStore(storeName).getAll();
  const records = await requestToPromise(request);
  database.close();
  return records as T[];
}

/**
 * Salva ou atualiza um registro. `put` faz os dois papéis: cria se o id não existir,
 * ou substitui o objeto inteiro se ele já existir.
 */
async function put(storeName: string, value: object): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).put(value);
  await transactionToPromise(transaction);
  database.close();
}

/** Coloca uma alteração na fila. Hoje ela fica local; amanhã um SyncService envia para a API. */
async function enqueue(operation: SyncOperation): Promise<void> {
  await put(STORES.syncQueue, operation);
}

/** Lê todas as tarefas persistidas, mais recentes primeiro. */
export async function getTasks(): Promise<Task[]> {
  const tasks = await getAll<Task>(STORES.tasks);
  return tasks.sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  );
}

/** Salva uma tarefa e registra que ela ainda precisa ser sincronizada. */
export async function saveTask(task: Task): Promise<void> {
  await put(STORES.tasks, task);
  await enqueue(createSyncOperation("task", task.id));
}

/** Lê as sessões para alimentar o histórico e as métricas de estudo. */
export async function getStudySessions(): Promise<StudySession[]> {
  const sessions = await getAll<StudySession>(STORES.studySessions);
  return sessions.sort((first, second) =>
    second.date.localeCompare(first.date),
  );
}

/** Salva uma sessão e mantém seu evento pendente na fila de sincronização. */
export async function saveStudySession(session: StudySession): Promise<void> {
  await put(STORES.studySessions, session);
  await enqueue(createSyncOperation("studySession", session.id));
}

/** Lê os registros do diário de estágio. */
export async function getInternshipEntries(): Promise<InternshipEntry[]> {
  const entries = await getAll<InternshipEntry>(STORES.internshipEntries);
  return entries.sort((first, second) => second.date.localeCompare(first.date));
}

/** Salva um registro do estágio e enfileira sua futura sincronização. */
export async function saveInternshipEntry(
  entry: InternshipEntry,
): Promise<void> {
  await put(STORES.internshipEntries, entry);
  await enqueue(createSyncOperation("internshipEntry", entry.id));
}

/** Retorna a quantidade de alterações que ainda não foram enviadas a um servidor. */
export async function getPendingSyncCount(): Promise<number> {
  const operations = await getAll<SyncOperation>(STORES.syncQueue);
  return operations.length;
}

/**
 * Cria uma operação com UUID e horário próprios. O UUID impede colisão quando dois
 * dispositivos criarem registros sem estarem conectados.
 */
function createSyncOperation(
  entity: SyncOperation["entity"],
  entityId: string,
): SyncOperation {
  return {
    id: crypto.randomUUID(),
    entity,
    entityId,
    action: "upsert",
    createdAt: new Date().toISOString(),
  };
}
