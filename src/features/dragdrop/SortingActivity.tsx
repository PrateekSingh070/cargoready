import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { Icon } from "@/components/Icon";
import { Button, ProgressBar } from "@/components/ui";
import {
  emptySortingRun,
  isSortingRunCurrent,
  nextTargetIndex,
  placeCargo,
  type SortingLesson,
} from "@/features/dragdrop/sortingLogic";
import { useProgress } from "@/store/progress";
import { lessonKey, type LessonLocation } from "@/store/progressData";

type Item = SortingLesson["items"][number];
type Feedback = {
  text: string;
  targetId?: string;
  result?: "correct" | "incorrect";
  hint?: string;
  sequence: number;
};

const collisionDetection: CollisionDetection = (args) =>
  args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);

function CargoTile({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({ id: `item:${item.id}` });
  const attachTile = useCallback(
    (node: HTMLButtonElement | null) => {
      setNodeRef(node);
      setActivatorNodeRef(node);
    },
    [setNodeRef, setActivatorNodeRef],
  );
  return (
    <button
      type="button"
      className="cargo-tile"
      data-dragging={isDragging}
      ref={attachTile}
      {...attributes}
      {...listeners}
    >
      <Icon name="box" /> {item.label}
    </button>
  );
}

function CargoBin({
  target,
  contents,
  feedback,
}: {
  target: Item;
  contents: Item[];
  feedback: Feedback | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `bin:${target.id}` });
  const highlight = feedback?.targetId === target.id ? feedback : undefined;
  return (
    <div className="cargo-bin" ref={setNodeRef} data-over={isOver}>
      <h3>{target.label}</h3>
      {highlight && (
        <span
          key={highlight.sequence}
          className="bin-feedback"
          data-result={highlight.result}
          aria-hidden="true"
        >
          {highlight.result === "correct" ? "Correct" : "Try again"}
        </span>
      )}
      {contents.length > 0 && (
        <ul>
          {contents.map((item) => (
            <li key={item.id}>
              <Icon name="check" /> {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SortingActivity({
  lesson,
  location,
}: {
  lesson: SortingLesson;
  location: LessonLocation;
}) {
  const saved = useProgress(
    (state) => state.progress.lessons[lessonKey(location)]?.sortingRun,
  );
  const updateSorting = useProgress((state) => state.updateSorting);
  const run =
    saved && isSortingRunCurrent(lesson, saved) ? saved : emptySortingRun;
  const [dragged, setDragged] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedBin, setSelectedBin] = useState("");
  const itemField = useId();
  const binField = useId();
  const shelfTitle = useRef<HTMLHeadingElement>(null);
  const completionTitle = useRef<HTMLHeadingElement>(null);
  const fallbackItem = useRef<HTMLSelectElement>(null);
  const pendingFocus = useRef<"shelf" | "completion" | "fallback" | null>(null);

  const remaining = lesson.items.filter(
    (item) => !run.matches.some((match) => match.itemId === item.id),
  );
  const complete = remaining.length === 0;
  const activeItem = lesson.items.find((item) => `item:${item.id}` === dragged);
  const binIds = lesson.targets.map((target) => `bin:${target.id}`);

  const moveByKeyboard: KeyboardCoordinateGetter = (
    event,
    { context, currentCoordinates },
  ) => {
    const current = binIds.findIndex((id) => id === context.over?.id);
    const index = nextTargetIndex(event.code, current, binIds.length);
    const targetId = index === undefined ? undefined : binIds[index];
    const target =
      targetId === undefined ? undefined : context.droppableRects.get(targetId);
    const item = context.collisionRect;
    if (!target || !item) return;
    event.preventDefault();
    return {
      x:
        currentCoordinates.x +
        target.left +
        target.width / 2 -
        (item.left + item.width / 2),
      y:
        currentCoordinates.y +
        target.top +
        target.height / 2 -
        (item.top + item.height / 2),
    };
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: moveByKeyboard,
      keyboardCodes: {
        start: ["Space", "Enter"],
        end: ["Space", "Enter"],
        cancel: ["Escape", "Tab"],
      },
      scrollBehavior: "auto",
    }),
  );

  useEffect(() => {
    if (pendingFocus.current === "shelf") shelfTitle.current?.focus();
    if (pendingFocus.current === "completion") completionTitle.current?.focus();
    if (pendingFocus.current === "fallback") fallbackItem.current?.focus();
    pendingFocus.current = null;
  }, [run]);

  function showFeedback(message: Omit<Feedback, "sequence">) {
    setFeedback((prior) => ({
      ...message,
      sequence: (prior?.sequence ?? 0) + 1,
    }));
  }

  function match(
    itemId: string,
    targetId: string,
    method: "keyboard" | "pointer" | "form",
  ) {
    const item = lesson.items.find((item) => item.id === itemId);
    const target = lesson.targets.find((entry) => entry.id === targetId);
    if (!item || !target) return;
    const result = placeCargo(lesson, run, itemId, targetId);
    if (result.status === "ignored") return;

    if (result.status === "correct") {
      if (result.run.matches.length === lesson.items.length)
        pendingFocus.current = "completion";
      else if (method === "keyboard") pendingFocus.current = "shelf";
      else if (method === "form") pendingFocus.current = "fallback";
      if (selectedItem === itemId) {
        setSelectedItem("");
        setSelectedBin("");
      }
      showFeedback({
        text: `${item.label} belongs in ${target.label}.`,
        targetId,
        result: "correct",
      });
    } else {
      showFeedback({
        text: `${item.label} does not belong in ${target.label}. Try another bin.`,
        targetId,
        result: "incorrect",
        hint:
          (result.run.misses[itemId] ?? 0) >= 2 ? lesson.hintText : undefined,
      });
    }
    updateSorting(location, lesson, (current) =>
      current === run ? result.run : current,
    );
  }

  function drop({ active, over, activatorEvent }: DragEndEvent) {
    setDragged(null);
    if (!over) {
      showFeedback({
        text: "No bin was selected. The item is still on the shelf.",
      });
      return;
    }
    match(
      String(active.id).slice(5),
      String(over.id).slice(4),
      activatorEvent instanceof KeyboardEvent ? "keyboard" : "pointer",
    );
  }

  function itemLabel(id: string) {
    return (
      lesson.items.find((item) => `item:${item.id}` === id)?.label ?? "cargo"
    );
  }

  return (
    <div className="sorting-activity">
      <p className="lesson-intro">{lesson.prompt}</p>
      <p>
        {run.matches.length} of {lesson.items.length} items sorted
      </p>
      <ProgressBar
        label="Items sorted"
        value={run.matches.length}
        max={lesson.items.length}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={({ active }) => setDragged(String(active.id))}
        onDragCancel={() => setDragged(null)}
        onDragEnd={drop}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press Space or Enter to pick up an item. Use arrow keys to choose a bin, Space or Enter to drop, or Escape to cancel.",
          },
          announcements: {
            onDragStart: ({ active }) =>
              `Picked up ${itemLabel(String(active.id))}.`,
            onDragOver: ({ over }) =>
              over
                ? `Over ${lesson.targets.find((target) => `bin:${target.id}` === over.id)?.label ?? "a bin"}.`
                : "No bin selected.",
            onDragEnd: () => undefined,
            onDragCancel: ({ active }) =>
              `Cancelled moving ${itemLabel(String(active.id))}.`,
          },
        }}
      >
        {!complete && (
          <div className="cargo-shelf">
            <h2 ref={shelfTitle} tabIndex={-1}>
              Cargo to sort
            </h2>
            <p>
              Drag an item into a bin, or press Space on an item, then use the
              arrow keys and Space to drop.
            </p>
            <ul>
              {remaining.map((item) => (
                <li key={item.id}>
                  <CargoTile item={item} />
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="cargo-bins">
          {lesson.targets.map((target) => (
            <CargoBin
              key={target.id}
              target={target}
              feedback={feedback}
              contents={lesson.items.filter((item) =>
                run.matches.some(
                  (match) =>
                    match.itemId === item.id && match.targetId === target.id,
                ),
              )}
            />
          ))}
        </div>
        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeItem && (
              <div className="cargo-tile cargo-overlay" aria-hidden="true">
                <Icon name="box" /> {activeItem.label}
              </div>
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
      <div className="sorting-feedback" role="status">
        {feedback && (
          <div key={feedback.sequence} data-result={feedback.result}>
            <p>{feedback.text}</p>
            {feedback.hint && (
              <p>
                <strong>Hint</strong> {feedback.hint}
              </p>
            )}
          </div>
        )}
      </div>
      {complete ? (
        <div className="sorting-complete">
          <h2 ref={completionTitle} tabIndex={-1}>
            All cargo sorted
          </h2>
          <Button
            variant="secondary"
            onClick={() => {
              pendingFocus.current = "shelf";
              setFeedback(null);
              updateSorting(location, lesson, () => emptySortingRun);
            }}
          >
            Sort again
          </Button>
        </div>
      ) : (
        <details className="sorting-alternative">
          <summary>Match without dragging</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              match(selectedItem, selectedBin, "form");
            }}
          >
            <div>
              <label htmlFor={itemField}>Item</label>
              <select
                id={itemField}
                ref={fallbackItem}
                value={selectedItem}
                onChange={(event) => setSelectedItem(event.target.value)}
              >
                <option value="">Choose cargo</option>
                {remaining.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={binField}>Bin</label>
              <select
                id={binField}
                value={selectedBin}
                onChange={(event) => setSelectedBin(event.target.value)}
              >
                <option value="">Choose a bin</option>
                {lesson.targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={!selectedItem || !selectedBin}>
              Check match
            </Button>
          </form>
        </details>
      )}
    </div>
  );
}
