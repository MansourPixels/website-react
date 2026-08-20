import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { Zap, ZapOff } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: CameraPage,
});

function CameraPage() {
  const [isFlashOn, setIsFlashOn] = useState(false);

  return (
    <footer className="p-10 flex items-center justify-between fixed bottom-16 md:bottom-20 inset-x-0">
      <Button id="galeria" className="size-13 rounded-lg p-0 overflow-hidden">
        <img id="galeria-thumb" src="" alt="" className="size-full" />
      </Button>
      <Button
        id="capturar"
        isIconOnly
        className="size-17 rounded-full border-4 border-white bg-black/50 p-1"
      >
        <span className="size-full rounded-full border-2 border-amber-500" />
      </Button>
      <Button
        id="flash"
        isIconOnly
        className="bg-black/35"
        onClick={() => setIsFlashOn(!isFlashOn)}
      >
        {isFlashOn ? <ZapOff /> : <Zap />}
      </Button>
    </footer>
  );
}
