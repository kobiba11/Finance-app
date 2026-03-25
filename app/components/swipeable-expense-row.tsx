"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

type SwipeableExpenseRowProps = {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
};

const SWIPE_THRESHOLD = 90;

export default function SwipeableExpenseRow({
  children,
  onEdit,
  onDelete,
}: SwipeableExpenseRowProps) {
  const x = useMotionValue(0);
  const [dragging, setDragging] = useState(false);
  const isHandlingRef = useRef(false);

  const resetPosition = () => {
    animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
  };

  const handleDragEnd = () => {
    if (isHandlingRef.current) return;

    const currentX = x.get();

    if (currentX >= SWIPE_THRESHOLD) {
      isHandlingRef.current = true;
      animate(x, 140, { duration: 0.15 });
      onEdit();
      return;
    }

    if (currentX <= -SWIPE_THRESHOLD) {
      isHandlingRef.current = true;
      animate(x, -140, { duration: 0.15 });
      onDelete();
      return;
    }

    resetPosition();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex items-center justify-between rounded-2xl">
        <div className="flex h-full w-1/2 items-center justify-start bg-red-500 px-4 text-white">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Trash2 size={16} />
            מחק
          </div>
        </div>

        <div className="flex h-full w-1/2 items-center justify-end bg-emerald-500 px-4 text-white">
          <div className="flex items-center gap-2 text-sm font-medium">
            ערוך
            <Pencil size={16} />
          </div>
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