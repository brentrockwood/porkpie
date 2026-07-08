import { FormEvent, useEffect, useRef, useState } from "react";
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
    syncUrl({ search: debouncedSearchFilter, tag: tagFilter, showCompleted, page, editingId }, lastUrl);
  }, [debouncedSearchFilter, editingId, page, showCompleted, tagFilter]);

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
      setTasks((current) => (page === 1 ? loaded.tasks : [...current, ...loaded.tasks]));
      setTotal(loaded.total);
      setTotalPages(loaded.totalPages);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load tasks");
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
    <main className="app-shell">
      <header>
        <p className="eyebrow">Porkpie</p>
        <h1>Tasks</h1>
        <p className="lede">A small TypeScript task app built to show clean end-to-end architecture.</p>
      </header>

      <TaskForm
        title={title}
        description={description}
        tagInput={tagInput}
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

      {error ? <p className="error">{error}</p> : null}

      <LoadMoreControls
        hasMore={page < totalPages}
        total={total}
        visibleCount={tasks.length}
        onLoadMore={() => setPage((current) => current + 1)}
      />

      <TaskList
        tasks={tasks}
        hasActiveFilters={Boolean(debouncedSearchFilter || tagFilter)}
        completionFilter={showCompleted ? "all" : "incomplete"}
        editingId={editingId}
        editingTitle={editingTitle}
        editingDescription={editingDescription}
        editingTags={editingTags}
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
    </main>
  );
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const page = Number(params.get("page") ?? "1");
  const editingId = window.location.pathname.split("/").filter(Boolean)[0] ?? null;

  return {
    search: params.get("search") ?? "",
    tag: params.get("tag") ?? "",
    showCompleted: params.get("showCompleted") === "true",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    editingId: editingId ? decodeURIComponent(editingId) : null,
  };
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
