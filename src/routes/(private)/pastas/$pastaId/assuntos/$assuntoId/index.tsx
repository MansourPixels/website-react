import { Spinner } from "@heroui/react";
import { Camera, FileText, ListCheck, Network, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { getDownloadUrl, listContent, searchContent } from "@/api/content";
import { listChildFolders } from "@/api/folders";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FABButton } from "@/components/FABButton";
import { MaterialViewer } from "@/components/MaterialViewer";
import { NavMenu } from "@/components/NavMenu";
import type { Content } from "@/types/api/content";
import type { ViewableFile } from "@/types/capture";
import { normalizeText } from "@/utils/text";
import { MaterialTile } from "./components/MaterialTile";
import { StudyTypeCard } from "./components/StudyTypeCard";

// Enquanto algum item ainda não tem resumo (hasSummary: false), reconsulta
// a lista a cada ~3s; desiste depois de ~60s para não pollar para sempre.
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 60_000;

/** Espera o usuário parar de digitar antes de consultar a API. */
const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

export default function SubjectDetailsPage() {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };

  const [subjectName, setSubjectName] = useState<string | null>(null);
  const [contents, setContents] = useState<Content[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<ViewableFile | null>(
    null,
  );
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Guardado ao lado do material: `ViewableFile` é documentado como "não
  // corresponde a um Content da API", e o painel de OCR precisa do id.
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");
  // Resultados da busca vivem em estado próprio: o poll de `hasSummary`
  // reescreve `contents` a cada 3s e atropelaria a busca.
  const [searchResults, setSearchResults] = useState<Content[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    listChildFolders(pastaId)
      .then((childFolders) => {
        if (cancelled) return;

        setSubjectName(
          childFolders.find((item) => item.id === assuntoId)?.name ?? null,
        );
      })
      .catch(() => {
        // Nome é só cosmético (título da página) — uma falha aqui não
        // deve travar o carregamento do conteúdo em si.
      });

    return () => {
      cancelled = true;
    };
  }, [pastaId, assuntoId]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    setContents(null);
    setLoadError(null);

    async function poll() {
      try {
        const result = await listContent(assuntoId);

        if (cancelled) return;

        setContents(result);

        const stillProcessing = result.some((item) => !item.hasSummary);
        const timedOut = Date.now() - startedAt > POLL_TIMEOUT_MS;

        if (stillProcessing && !timedOut) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar os materiais. Tente novamente.",
        );
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [assuntoId, reloadKey]);

  useEffect(() => {
    const trimmed = search.trim();

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setSearchResults(null);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(() => {
      searchContent(assuntoId, trimmed, controller.signal)
        .then((found) => {
          if (!controller.signal.aborted) setSearchResults(found);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;

          setSearchError(
            error instanceof ApiError
              ? error.detail
              : "Não foi possível buscar agora. Tente novamente.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [assuntoId, search]);

  async function handleOpenMaterial(content: Content) {
    setViewerError(null);

    try {
      const { url } = await getDownloadUrl(content.id);

      setSelectedMaterial({
        name: content.name,
        url,
        contentType: content.contentType,
      });
      setSelectedContentId(content.id);
    } catch (error) {
      setViewerError(
        error instanceof ApiError
          ? error.detail
          : "Não foi possível abrir este material. Tente novamente.",
      );
    }
  }

  const trimmedSearch = search.trim();
  const isSearchActive = trimmedSearch.length >= MIN_SEARCH_LENGTH;
  const materials = contents ?? [];
  // Com busca ativa, a API manda; abaixo do mínimo de caracteres o filtro
  // local segue valendo, para digitar uma letra não esvaziar a tela.
  const filteredMaterials = isSearchActive
    ? (searchResults ?? [])
    : trimmedSearch.length > 0
      ? materials.filter((content) =>
          normalizeText(content.name).includes(normalizeText(trimmedSearch)),
        )
      : materials;

  return (
    <main className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu
        title={subjectName ?? "Assunto"}
        hasBackButton
        backHref={`/pastas/${pastaId}`}
        hasSearch
        onSearch={setSearch}
        isSearching={isSearching}
      />
      <section
        id="tipos-estudo"
        className="grid md:grid-cols-2 gap-3"
      >
        <StudyTypeCard
          id="flash-cards"
          name="Flash Cards"
          description="Cartões de memorização que utilizam aprendizagem ativa e a repetição espaçada."
          icon={Zap}
          iconClass="bg-emerald-500"
        />
        <StudyTypeCard
          id="resumo"
          name="Resumo"
          description="Texto conciso para sintetizar as ideias principais do assunto proposto."
          icon={FileText}
          iconClass="bg-purple-700"
        />
        <StudyTypeCard
          id="simulado-prova"
          name="Simulado de prova"
          description="Reprodução simulada no formato de uma prova com o objetivo de preparar o aluno."
          icon={ListCheck}
          iconClass="bg-orange-600"
        />
        <StudyTypeCard
          id="mapa-mental"
          name="Mapa mental"
          description="Explore os conceitos do assunto em ramos, expandindo o que quiser aprofundar."
          icon={Network}
          iconClass="bg-cyan-600"
        />
      </section>

      {viewerError !== null ? (
        <ErrorState isCompact>{viewerError}</ErrorState>
      ) : null}

      {contents === null && loadError === null ? (
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando materiais</span>
        </div>
      ) : loadError !== null ? (
        <ErrorState onRetry={() => setReloadKey((k) => k + 1)}>
          {loadError}
        </ErrorState>
      ) : searchError !== null ? (
        <ErrorState>{searchError}</ErrorState>
      ) : isSearchActive && searchResults === null ? (
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Buscando materiais</span>
        </div>
      ) : filteredMaterials.length > 0 ? (
        <section
          id="materiais"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 h-full"
        >
          {filteredMaterials.map((content) => (
            <MaterialTile
              key={content.id}
              content={content}
              onOpen={() => handleOpenMaterial(content)}
            />
          ))}
        </section>
      ) : (
        <EmptyState>
          {trimmedSearch.length > 0
            ? `Nenhum material encontrado para "${trimmedSearch}".`
            : "Este assunto ainda não tem materiais. Adicione o primeiro pela câmera."}
        </EmptyState>
      )}
      <FABButton
        icon={Camera}
        aria-label="Capturar material para este assunto"
        onPress={() => navigate("camera")}
        className="bottom-[calc(var(--nav-inset)+1rem)]"
      />
      <MaterialViewer
        material={selectedMaterial}
        contentId={selectedContentId ?? undefined}
        onClose={() => {
          setSelectedMaterial(null);
          setSelectedContentId(null);
        }}
      />
    </main>
  );
}
