import { FormEvent, useEffect, useRef, useState } from "react";
import { Alert, Container, Typography } from "@mui/material";
import type { Task } from "@porkpie/shared";
import { createTask, deleteTask, listTags, listTasks, updateTask } from "./api";
import { LoadMoreControls } from "./components/LoadMoreControls";
import { TaskFiltersForm } from "./components/TaskFiltersForm";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import "./styles.css";

type UrlState = {
  search: string;
  tag: string;
  showCompleted: boolean;
  page: number;
  editingId: string | null;
};

const initialUrlState = readUrlState();

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState(initialUrlState.search);
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState(initialUrlState.search);
  const [tagFilter, setTagFilter] = useState(initialUrlState.tag);
  const [showCompleted, setShowCompleted] = useState(initialUrlState.showCompleted);
  const [page, setPage] = useState(initialUrlState.page);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingEditingId, setPendingEditingId] = useState<string | null>(initialUrlState.editingId);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingTags, setEditingTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const reloadRequestId = useRef(0);
  const lastUrl = useRef(window.location.pathname + window.location.search);

  useEffect(() => {
    void reloadTags();
  }, []);

  useEffect(() => {
    function handlePopState() {
      const urlState = readUrlState();
      lastUrl.current = window.location.pathname + window.location.search;
      setSearchFilter(urlState.search);
      setDebouncedSearchFilter(urlState.search);
      setTagFilter(urlState.tag);
      setShowCompleted(urlState.showCompleted);
      setPage(urlState.page);
      setPendingEditingId(urlState.editingId);
      if (urlState.editingId !== editingId) {
        setEditingId(null);
        setEditingTitle("");
        setEditingDescription("");
        setEditingTags("");
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [editingId]);

  useEffect(() => {
    if (searchFilter === debouncedSearchFilter) return;

    const timeout = window.setTimeout(() => {
      setDebouncedSearchFilter(searchFilter);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [debouncedSearchFilter, searchFilter]);

  useEffect(() => {
    if (pendingEditingId) return;
    syncUrl({ search: debouncedSearchFilter, tag: tagFilter, showCompleted, page, editingId }, lastUrl);
  }, [debouncedSearchFilter, editingId, page, pendingEditingId, showCompleted, tagFilter]);

  useEffect(() => {
    const controller = new AbortController();
    void reloadTasks(controller.signal);
    return () => controller.abort();
  }, [debouncedSearchFilter, tagFilter, showCompleted, page]);

  useEffect(() => {
    if (!pendingEditingId || editingId === pendingEditingId) return;

    const task = tasks.find((item) => item.id === pendingEditingId);
    if (task) {
      openEditing(task);
      setPendingEditingId(null);
    }
  }, [editingId, pendingEditingId, tasks]);

  async function reloadTasks(signal?: AbortSignal) {
    const requestId = reloadRequestId.current + 1;
    reloadRequestId.current = requestId;
    setIsLoadingTasks(true);

    try {
      setError(null);
      const loaded = await listTasks(
        {
          search: debouncedSearchFilter,
          tag: tagFilter,
          completed: showCompleted ? "all" : "incomplete",
          page,
        },
        signal,
      );
      if (requestId !== reloadRequestId.current) return;
      setTasks((current) => (page === 1 ? loaded.tasks : appendUniqueTasks(current, loaded.tasks)));
      setTotal(loaded.total);
      setTotalPages(loaded.totalPages);
      if (pendingEditingId && !loaded.tasks.some((task) => task.id === pendingEditingId)) {
        setPendingEditingId(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (requestId !== reloadRequestId.current) return;
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      if (requestId === reloadRequestId.current) {
        setIsLoadingTasks(false);
      }
    }
  }

  async function reloadTags() {
    try {
      setAvailableTags(await listTags());
    } catch {
      // Tag suggestions are optional; task loading should remain usable if this request fails.
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await createTask({ title, description, tags: parseTags(tagInput) });
      if (page === 1) await reloadTasks();
      else setPage(1);
      await reloadTags();
      setTitle("");
      setDescription("");
      setTagInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  async function handleToggle(task: Task) {
    setError(null);

    try {
      await updateTask(task.id, { completed: !task.completed });
      if (page === 1) await reloadTasks();
      else setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  async function handleSave(task: Task) {
    setError(null);

    try {
      await updateTask(task.id, {
        title: editingTitle,
        description: editingDescription,
        tags: parseTags(editingTags),
      });
      clearEditing();
      if (page === 1) await reloadTasks();
      else setPage(1);
      await reloadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    }
  }

  async function handleDelete(task: Task) {
    setError(null);

    try {
      await deleteTask(task.id);
      if (editingId === task.id) {
        clearEditing();
      }
      if (page === 1) await reloadTasks();
      else setPage(1);
      await reloadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  function handleSearchFilterChange(value: string) {
    setSearchFilter(value);
  }

  function handleTagFilterChange(value: string) {
    setTagFilter(value);
    setPage(1);
  }

  function handleShowCompletedChange(value: boolean) {
    setShowCompleted(value);
    setPage(1);
  }

  function handleTagClick(tagName: string) {
    setTagFilter(tagName);
    setPage(1);
  }

  function startEditing(task: Task) {
    openEditing(task);
    setPendingEditingId(null);
  }

  function openEditing(task: Task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description ?? "");
    setEditingTags(task.tags.map((tag) => tag.name).join(", "));
  }

  function cancelEditing() {
    clearEditing();
  }

  function clearEditing() {
    setEditingId(null);
    setPendingEditingId(null);
    setEditingTitle("");
    setEditingDescription("");
    setEditingTags("");
  }

  return (
    <Container className="app-shell" component="main" maxWidth="md">
      <header>
        <Typography className="eyebrow" component="p">
          Porkpie
        </Typography>
        <Typography component="h1" variant="h2">
          Tasks
        </Typography>
        <Typography className="lede" color="text.secondary">
          A small TypeScript task app built to show clean end-to-end architecture.
        </Typography>
      </header>

      <TaskForm
        title={title}
        description={description}
        tagInput={tagInput}
        availableTags={availableTags}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onTagInputChange={setTagInput}
        onSubmit={handleCreate}
      />

      <TaskFiltersForm
        searchFilter={searchFilter}
        tagFilter={tagFilter}
        availableTags={availableTags}
        showCompleted={showCompleted}
        onSearchFilterChange={handleSearchFilterChange}
        onTagFilterChange={handleTagFilterChange}
        onShowCompletedChange={handleShowCompletedChange}
      />

      {error ? (
        <Alert className="error" severity="error">
          {error}
        </Alert>
      ) : null}

      <TaskList
        tasks={tasks}
        hasActiveFilters={Boolean(debouncedSearchFilter || tagFilter)}
        completionFilter={showCompleted ? "all" : "incomplete"}
        editingId={editingId}
        editingTitle={editingTitle}
        editingDescription={editingDescription}
        editingTags={editingTags}
        availableTags={availableTags}
        onToggle={(task) => void handleToggle(task)}
        onStartEditing={startEditing}
        onSave={(task) => void handleSave(task)}
        onCancelEditing={cancelEditing}
        onDelete={(task) => void handleDelete(task)}
        onEditingTitleChange={setEditingTitle}
        onEditingDescriptionChange={setEditingDescription}
        onEditingTagsChange={setEditingTags}
        onTagClick={handleTagClick}
      />

      <LoadMoreControls
        hasMore={page < totalPages}
        total={total}
        visibleCount={tasks.length}
        isLoading={isLoadingTasks}
        onLoadMore={() => {
          if (isLoadingTasks) return;
          setIsLoadingTasks(true);
          setPage((current) => current + 1);
        }}
      />
    </Container>
  );
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function appendUniqueTasks(current: Task[], loaded: Task[]): Task[] {
  const seen = new Set(current.map((task) => task.id));
  return [...current, ...loaded.filter((task) => !seen.has(task.id))];
}

function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const page = Number(params.get("page") ?? "1");
  const rawEditingId = window.location.pathname.split("/").filter(Boolean)[0] ?? null;

  return {
    search: params.get("search") ?? "",
    tag: params.get("tag") ?? "",
    showCompleted: params.get("showCompleted") === "true",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    editingId: rawEditingId ? safeDecodeURIComponent(rawEditingId) : null,
  };
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function syncUrl(state: UrlState, lastUrl: { current: string }): void {
  const nextUrl = buildUrl(state);
  if (nextUrl === lastUrl.current) return;

  window.history.pushState(null, "", nextUrl);
  lastUrl.current = nextUrl;
}

function buildUrl({ search, tag, showCompleted, page, editingId }: UrlState): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (tag) params.set("tag", tag);
  if (showCompleted) params.set("showCompleted", "true");
  if (page > 1) params.set("page", String(page));

  const path = editingId ? `/${encodeURIComponent(editingId)}` : "/";
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
