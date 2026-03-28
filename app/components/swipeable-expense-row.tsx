"use client";

import { motion, useMotionValue, animate, PanInfo } from "framer-motion";
import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

type SwipeableExpenseRowProps = {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
};

const SWIPE_THRESHOLD = 90;
const OPEN_OFFSET = 96;
const CLICK_SUPPRESS_THRESHOLD = 10;

export default function SwipeableExpenseRow({
  children,
  onEdit,
  onDelete,
}: SwipeableExpenseRowProps) {
  const x = useMotionValue(0);
  const [dragging, setDragging] = useState(false);

  const isHandlingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const movedDistanceRef = useRef(0);

  const resetPosition = () => {
    animate(x, 0, {
      type: "spring",
      stiffness: 320,
      damping: 28,
    });

    setTimeout(() => {
      isHandlingRef.current = false;
    }, 220);
  };

  const suppressClicksTemporarily = () => {
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 500);
  };

  const blockIfSuppressed = (e: React.SyntheticEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleDragEnd = () => {
    if (isHandlingRef.current) return;

    const currentX = x.get();

    if (movedDistanceRef.current > CLICK_SUPPRESS_THRESHOLD) {
      suppressClicksTemporarily();
    }

    // ימינה = מחיקה
    if (currentX >= SWIPE_THRESHOLD) {
      isHandlingRef.current = true;
      animate(x, OPEN_OFFSET, { duration: 0.14 });

      setTimeout(() => {
        onDelete();
        resetPosition();
      }, 120);
      return;
    }

    // שמאלה = עריכה
    if (currentX <= -SWIPE_THRESHOLD) {
      isHandlingRef.current = true;
      animate(x, -OPEN_OFFSET, { duration: 0.14 });

      setTimeout(() => {
        onEdit();
        resetPosition();
      }, 120);
      return;
    }

    resetPosition();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 rounded-2xl bg-white" />

      {/* ימין = מחיקה */}
      <div className="absolute inset-y-0 right-0 flex items-stretch justify-end">
        <div className="flex w-24 items-center justify-center rounded-r-2xl bg-red-500 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Trash2 size={16} />
            מחק
          </div>
        </div>
      </div>

      {/* שמאל = עריכה */}
      <div className="absolute inset-y-0 left-0 flex items-stretch justify-start">
        <div className="flex w-24 items-center justify-center rounded-l-2xl bg-emerald-500 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Pencil size={16} />
            ערוך
          </div>
        </div>
      </div>

      <motion.div
        drag="x"
        dragElastic={0.06}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => {
          setDragging(true);
          movedDistanceRef.current = 0;
        }}
        onDrag={(_, info: PanInfo) => {
          movedDistanceRef.current = Math.abs(info.offset.x);
        }}
        onDragEnd={() => {
          setDragging(false);
          handleDragEnd();
        }}
        onClickCapture={blockIfSuppressed}
        onPointerUpCapture={blockIfSuppressed}
        onMouseUpCapture={blockIfSuppressed}
        onTouchEndCapture={blockIfSuppressed}
        className={
          dragging
            ? "relative z-10 touch-pan-y cursor-grabbing"
            : "relative z-10 touch-pan-y cursor-grab"
        }
      >
        <div className="rounded-2xl bg-white">{children}</div>
      </motion.div>
    </div>
  );
}