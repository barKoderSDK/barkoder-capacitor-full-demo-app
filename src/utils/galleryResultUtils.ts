import type { BarkoderResult } from 'barkoder-capacitor';
import type { ScannedItem } from '../types/types';

export const toDataUrl = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  return value.startsWith('data:') ? value : `data:image/jpeg;base64,${value}`;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });

const normalizePointScale = (
  points: Array<{ x: number; y: number }>,
  imageWidth: number,
  imageHeight: number,
): Array<{ x: number; y: number }> => {
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));

  if (maxX <= 1 && maxY <= 1) {
    return points.map((point) => ({
      x: point.x * imageWidth,
      y: point.y * imageHeight,
    }));
  }

  if (maxX <= 100 && maxY <= 100) {
    return points.map((point) => ({
      x: (point.x / 100) * imageWidth,
      y: (point.y / 100) * imageHeight,
    }));
  }

  return points;
};

const getOrientedBounds = (
  points: Array<{ x: number; y: number }>,
  angle: number,
  center: { x: number; y: number },
) => {
  const axisX = { x: Math.cos(angle), y: Math.sin(angle) };
  const axisY = { x: -axisX.y, y: axisX.x };

  const projectedX: number[] = [];
  const projectedY: number[] = [];

  points.forEach((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    projectedX.push(dx * axisX.x + dy * axisX.y);
    projectedY.push(dx * axisY.x + dy * axisY.y);
  });

  const minX = Math.min(...projectedX);
  const maxX = Math.max(...projectedX);
  const minY = Math.min(...projectedY);
  const maxY = Math.max(...projectedY);

  return {
    axisX,
    axisY,
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const createGalleryBarcodePreview = async (
  fullImageDataUrl: string | undefined,
  locationPoints?: Array<{ x: number; y: number }>,
): Promise<string | undefined> => {
  if (!fullImageDataUrl || !locationPoints || locationPoints.length < 2) {
    return fullImageDataUrl;
  }

  try {
    const sourceImage = await loadImage(fullImageDataUrl);
    const imageWidth = sourceImage.naturalWidth || sourceImage.width;
    const imageHeight = sourceImage.naturalHeight || sourceImage.height;
    if (imageWidth <= 0 || imageHeight <= 0) {
      return fullImageDataUrl;
    }

    const normalizedPoints = normalizePointScale(locationPoints, imageWidth, imageHeight);
    const center = {
      x: normalizedPoints.reduce((sum, point) => sum + point.x, 0) / normalizedPoints.length,
      y: normalizedPoints.reduce((sum, point) => sum + point.y, 0) / normalizedPoints.length,
    };

    // Estimate dominant orientation using PCA so we don't depend on point order.
    const covariance = normalizedPoints.reduce(
      (accumulator, point) => {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        return {
          xx: accumulator.xx + dx * dx,
          yy: accumulator.yy + dy * dy,
          xy: accumulator.xy + dx * dy,
        };
      },
      { xx: 0, yy: 0, xy: 0 },
    );

    let edgeAngle = 0.5 * Math.atan2(2 * covariance.xy, covariance.xx - covariance.yy);
    let bounds = getOrientedBounds(normalizedPoints, edgeAngle, center);
    if (bounds.height > bounds.width) {
      edgeAngle += Math.PI / 2;
      bounds = getOrientedBounds(normalizedPoints, edgeAngle, center);
    }

    const padding = 24;
    const cropWidth = Math.max(1, Math.ceil(bounds.width + padding * 2));
    const cropHeight = Math.max(1, Math.ceil(bounds.height + padding * 2));

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return fullImageDataUrl;
    }

    const bboxCenterX = (bounds.minX + bounds.maxX) / 2;
    const bboxCenterY = (bounds.minY + bounds.maxY) / 2;
    const imageBboxCenterX = center.x + bounds.axisX.x * bboxCenterX + bounds.axisY.x * bboxCenterY;
    const imageBboxCenterY = center.y + bounds.axisX.y * bboxCenterX + bounds.axisY.y * bboxCenterY;

    context.translate(cropWidth / 2, cropHeight / 2);
    context.rotate(-edgeAngle);
    context.drawImage(sourceImage, -imageBboxCenterX, -imageBboxCenterY);
    context.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (error) {
    console.error('Failed to create gallery barcode preview', error);
    return fullImageDataUrl;
  }
};

export const mapGalleryResultToItems = async (
  result: BarkoderResult,
  fallbackSourceImage?: string,
): Promise<ScannedItem[]> => {
  if (!result.decoderResults || result.decoderResults.length === 0) {
    return [];
  }

  const fullImage = toDataUrl(result.resultImageAsBase64) ?? fallbackSourceImage;
  const thumbnail = result.resultThumbnailsAsBase64?.[0];
  const fallbackImage = toDataUrl(thumbnail) ?? fullImage;

  return Promise.all(
    result.decoderResults.map(async (decoded) => ({
      text: decoded.textualData,
      type: decoded.barcodeTypeName,
      image: (await createGalleryBarcodePreview(fullImage, decoded.locationPoints)) ?? fallbackImage,
    })),
  );
};
