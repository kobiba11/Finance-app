"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

type SwipeableFinanceRowProps = {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
};

const SWIPE_THRESHOLD = 90;
const ACTION_OFFSET = 140;

export default function SwipeableFinanceRow({
  children,
  onEdit,
  onDelete,
  editLabel = "ערוך",
  deleteLabel = "מחק",
}: SwipeableFinanceRowProps) {
  const x = useMotionValue(0);
  const [dragging, setDragging] = useState(false);
  const isHandlingRef = useRef(false);

  const hasEdit = typeof onEdit === "function";
  const hasDelete = typeof onDelete === "function";

  const resetPosition = () => {
    animate(x, 0, {
      type: "spring",
      stiffness: 300,
      damping: 25,
    }).then(() => {
      isHandlingRef.current = false;
    });
  };

  const handleDragEnd = async () => {
    if (isHandlingRef.current) return;

    const currentX = x.get();

    if (currentX >= SWIPE_THRESHOLD && hasEdit) {
      isHandlingRef.current = true;
      await animate(x, ACTION_OFFSET, { duration: 0.15 });
      onEdit?.();
      resetPosition();
      return;
    }

    if (currentX <= -SWIPE_THRESHOLD && hasDelete) {
      isHandlingRef.current = true;
      await animate(x, -ACTION_OFFSET, { duration: 0.15 });
      onDelete?.();
      resetPosition();
      return;
    }

    resetPosition();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex items-center justify-between rounded-2xl">
        <div
          className={`flex h-full w-1/2 items-center justify-start px-4 text-white ${
            hasDelete ? "bg-red-500" : "bg-slate-200"
          }`}
        >
          {hasDelete && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trash2 size={16} />
              {deleteLabel}
            </div>
          )}
        </div>

        <div
          className={`flex h-full w-1/2 items-center justify-end px-4 text-white ${
            hasEdit ? "bg-emerald-500" : "bg-slate-200"
          }`}
        >
          {hasEdit && (
            <div className="flex items-center gap-2 text-sm font-medium">
              {editLabel}
              <Pencil size={16} />
            </div>
          )}
        </div>
      </div>

      <motion.div
        drag="x"
        dragElastic={0.08}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => {
          setDragging(false);
          handleDragEnd();
        }}
        className={`relative touch-pan-y ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {children}
      </motion.div>
    </div>
  );
}