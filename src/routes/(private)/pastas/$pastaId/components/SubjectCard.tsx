import type { ChildFolder } from "@/types/api/folder";
import {
  Button,
  ButtonGroup,
  buttonVariants,
  Popover,
  Skeleton,
} from "@heroui/react";
import { Link, useParams } from "react-router";
import {
  Ellipsis,
  FileText,
  ListCheck,
  Network,
  SquarePen,
  Trash,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { DialogFormSubject } from "./DialogFormSubject";
import { DialogSubjectExclusion } from "./DialogSubjectExclusion";

interface SubjectCardProps {
  subject: ChildFolder;
  onChangeSubject: (subject: ChildFolder) => void;
  onDeleteSubject: (subject: ChildFolder) => void;
}

export function SubjectCard(props: SubjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { pastaId } = useParams<"pastaId">() as { pastaId: string };

  function openDialog(open: (isOpen: boolean) => void) {
    setIsMenuOpen(false);
    open(true);
  }
  const { subject, onChangeSubject, onDeleteSubject } = props;
  const basePath = `/pastas/${pastaId}/assuntos/${subject.id}`;

  return (
    <article className="relative bg-white rounded-xl shadow-surface hover:brightness-105">
      <Link to={basePath} className="px-3 block h-full">
        <div className="pt-3 pb-2 flex flex-col gap-4 h-full justify-between">
          <h2 className="leading-tight font-semibold line-clamp-2 h-10">
            {subject.name}
          </h2>
        </div>
      </Link>

      <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Opções do assunto ${subject.name}`}
          className="absolute bottom-2 right-2"
        >
          <Ellipsis />
        </Button>
        <Popover.Content
          className="max-w-64 rounded-xl z-10!"
          placement="bottom end"
        >
          <Popover.Dialog className="p-2">
            <ButtonGroup orientation="vertical">
              <Link
                to={`${basePath}/flash-cards`}
                className={buttonVariants({
                  className: "w-full justify-start border-b text-emerald-500",
                  variant: "ghost",
                })}
              >
                <Zap /> Flash Cards
              </Link>
              <Link
                to={`${basePath}/resumo`}
                className={buttonVariants({
                  className: "w-full justify-start border-b text-purple-700",
                  variant: "ghost",
                })}
              >
                <FileText /> Resumo
              </Link>
              <Link
                to={`${basePath}/simulado-prova`}
                className={buttonVariants({
                  className: "w-full justify-start border-b text-orange-600",
                  variant: "ghost",
                })}
              >
                <ListCheck /> Simulado de prova
              </Link>
              <Link
                to={`${basePath}/mapa-mental`}
                className={buttonVariants({
                  className: "w-full justify-start border-b text-cyan-600",
                  variant: "ghost",
                })}
              >
                <Network /> Mapa mental
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-accent-soft-foreground"
                onPress={() => openDialog(setIsEditOpen)}
              >
                <SquarePen /> Renomear assunto
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-b-lg text-danger"
                onPress={() => openDialog(setIsDeleteOpen)}
              >
                <Trash /> Excluir assunto
              </Button>
            </ButtonGroup>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      <DialogFormSubject
        subject={subject}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={onChangeSubject}
      />
      <DialogSubjectExclusion
        subject={subject}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={onDeleteSubject}
      />
    </article>
  );
}

export function LoadingSubjectCard() {
  return (
    <article className="relative bg-white rounded-xl shadow-surface">
      <div className="px-3 pt-4 pb-2 flex flex-col gap-4 h-full justify-between">
        <header className="h-10 flex flex-col justify-between">
          <Skeleton className="rounded-full h-4 w-3/4" />
          <Skeleton className="rounded-full h-4 w-11/12" />
        </header>
      </div>
    </article>
  );
}
