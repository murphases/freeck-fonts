// useFontPreview.ts — carrega fontes dinamicamente para preview no browser
import { useState, useEffect, useRef } from "react";
import { Font } from "@shared/types";

interface PreviewState {
  loaded: boolean;
  fontFaceId: string;
}

// Cache para evitar recarregar a mesma fonte
const loadedFonts = new Set<string>();

export function useFontPreview(
  font: Font | null,
  previewSize = 32,
): PreviewState {
  const [loaded, setLoaded] = useState(false);
  const fontFaceIdRef = useRef("");

  useEffect(() => {
    if (!font) {
      setLoaded(false);
      return;
    }

    // Se a fonte já está instalada, usa o nome da família diretamente
    if (font.isInstalled) {
      fontFaceIdRef.current = font.family;
      setLoaded(true);
      return;
    }

    const fontFaceId = `ff-${font.id.replace(/[^a-z0-9]/gi, "-")}`;
    fontFaceIdRef.current = fontFaceId;

    // Já carregada anteriormente
    if (loadedFonts.has(fontFaceId)) {
      setLoaded(true);
      return;
    }

    // Tenta carregar a variante regular (peso 400, estilo normal)
    const regularVariant =
      font.variants.find((v) => v.weight === 400 && v.style === "normal") ||
      font.variants[0];

    // Se não há URL de variante (fontes de scraping), resolve imediatamente
    // O FontCard usará previewImageUrl ou o nome da família como fallback
    if (!regularVariant?.url) {
      fontFaceIdRef.current = font.family;
      setLoaded(true);
      return;
    }

    const fontFace = new FontFace(fontFaceId, `url(${regularVariant.url})`);
    fontFace
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
        loadedFonts.add(fontFaceId);
        setLoaded(true);
      })
      .catch(() => {
        // Se falhar (CORS, etc.), usa o nome da família
        fontFaceIdRef.current = font.family;
        setLoaded(true);
      });

    setLoaded(false);
  }, [font?.id]);

  return { loaded, fontFaceId: fontFaceIdRef.current };
}
