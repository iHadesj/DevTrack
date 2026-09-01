import { motion } from "framer-motion";
import { useEffect, type MouseEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { BauhausMotif } from "./BauhausMotif";
import { ModalBody, ModalCloseButton, ModalContainer, ModalDescription, ModalFooter, ModalHeader, ModalOverlay, ModalTitle } from "../styles";

/** Dados necessários para qualquer modal reutilizável do DevTrack. */
export interface ModalProps { title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; }

/** Janela acessível com animação de entrada; o state da página pai ainda controla abrir/fechar. */
export function Modal({ title, description, onClose, children, footer }: ModalProps) {
    /** Fecha pelo Escape e impede a página de rolar enquanto a janela estiver aberta. */
    useEffect(() => {
        const closeWithEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", closeWithEscape);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", closeWithEscape); document.body.style.overflow = ""; };
    }, [onClose]);

    /** Impede que o clique dentro do conteúdo seja tratado como clique no fundo. */
    const stopClose = (event: MouseEvent<HTMLDivElement>) => event.stopPropagation();

    return <ModalOverlay onMouseDown={onClose} role="presentation"><motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 16 }} transition={{ type: "spring", stiffness: 330, damping: 25 }} onMouseDown={stopClose}><ModalContainer role="dialog" aria-modal="true" aria-label={title}><BauhausMotif variant="modal" /><ModalHeader><div><ModalTitle>{title}</ModalTitle>{description && <ModalDescription>{description}</ModalDescription>}</div><ModalCloseButton type="button" aria-label="Fechar modal" onClick={onClose}><X size={17} /></ModalCloseButton></ModalHeader><ModalBody>{children}</ModalBody>{footer && <ModalFooter>{footer}</ModalFooter>}</ModalContainer></motion.div></ModalOverlay>;
}
