"use client";

import { ReactNode, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

type SwipeTabsProviderProps = {
  children: ReactNode;
};

const tabs = [
  "/dashboard",
  "/expenses",
  "/subscriptions",
  "/vouchers",
  "/credits",
  "/settings",
];

export default function SwipeTabsProvider({
  children,
}: SwipeTabsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);

  const [direction, setDirection] = useState(0);

  const currentIndex = useMemo(() => {
    return tabs.findIndex((tab) => pathname.startsWith(tab));
  }, [pathname]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentX.current = touch.clientX;
    currentY.current = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    currentX.current = touch.clientX;
    currentY.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (
      startX.current === null ||
      startY.current === null ||
      currentX.current === null ||
      currentY.current === null
    ) {
      return;
    }

    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;

    const minHorizontalDistance = 70;
    const maxVerticalDistance = 60;

    const isHorizontalSwipe =
      Math.abs(deltaX) > minHorizontalDistance &&
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaY) < maxVerticalDistance;

    if (!isHorizontalSwipe || currentIndex === -1) {
      return;
    }

    // swipe שמאלה = מעבר לטאב הבא
    if (deltaX < 0 && currentIndex < tabs.length - 1) {
      setDirection(1);
      router.push(tabs[currentIndex + 1]);
      return;
    }

    // swipe ימינה = חזרה לטאב הקודם
    if (deltaX > 0 && currentIndex > 0) {
      setDirection(-1);
      router.push(tabs[currentIndex - 1]);
    }
  };

  return (
    <div
      className="min-h-screen touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{
            opacity: 0,
            x: direction === 1 ? 28 : direction === -1 ? -28 : 0,
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: direction === 1 ? -20 : direction === -1 ? 20 : 0,
          }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}