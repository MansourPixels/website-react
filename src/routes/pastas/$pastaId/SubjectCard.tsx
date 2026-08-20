import { Button, ButtonGroup, Popover, Skeleton } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import {
  Ellipsis,
  FileText,
  ListCheck,
  SquarePen,
  Trash,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { Subject } from "../../../types/Subject";
import { DialogFormSubject } from "./DialogFormSubject";
import { DialogSubjectExclusion } from "./DialogSubjectExclusion";

type SubjectCardProps =
  | {
      isLoading: true;
      subject?: never;
      onChangeSubject?: never;
      onDeleteSubject?: never;
    }
  | {
      isLoading?: false;
      subject: Subject;
      onChangeSubject: (subject: Subject) => void;
      onDeleteSubject: (subject: Subject) => void;
    };

export function SubjectCard(props: SubjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  function openDialog(open: (isOpen: boolean) => void) {
    setIsMenuOpen(false);
    open(true);
  }

  if (props.isLoading) {
    return (
      <article className="relative bg-white rounded-xl">
        <div className="px-3 pt-4 pb-2 flex flex-col gap-4 h-full justify-between">
          <header className="h-10 flex flex-col justify-between">
            <Skeleton className="rounded-full h-4 w-3/4" />
            <Skeleton className="rounded-full h-4 w-11/12" />
          </header>
          <div className="grid grid-cols-2 gap-2 *:rounded-lg *:w-full *:aspect-video">
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
          <footer className="flex items-center h-8">
            <Skeleton className="rounded-full h-4 w-1/2" />
          </footer>
        </div>
      </article>
    );
  }

  const { subject, onChangeSubject, onDeleteSubject } = props;

  return (
    <article className="relative bg-white rounded-xl hover:brightness-105">
      <Link to="/" className="px-3 block h-full">
        <div className="pt-3 pb-2 flex flex-col gap-4 h-full justify-between">
          <h2 className="leading-tight font-semibold line-clamp-2 h-10">
            {subject.name}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {subject.images.map((image) => (
              <img
                key={image}
                src={image}
                alt=""
                className="rounded-lg aspect-video w-full object-cover"
              />
            ))}
          </div>
          <footer className="flex items-center h-8">
            <span className="text-xs text-zinc-500">HOJE</span>
          </footer>
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
                to="/"
                className="button button--md button--ghost w-full justify-start rounded-t-lg text-cyan-700"
              >
                <Zap /> Flash Cards
              </Link>
              <Link
                to="/"
                className="button button--md button--ghost w-full justify-start text-purple-700"
              >
                <FileText /> Resumo
              </Link>
              <Link
                to="/"
                className="button button--md button--ghost w-full justify-start border-b text-orange-600"
              >
                <ListCheck /> Simulado de prova
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
