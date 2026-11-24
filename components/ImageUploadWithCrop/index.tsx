'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    Button,
    Modal,
    Group,
    Text,
    Loader,
    Progress,
    ActionIcon,
    Stack,
    Paper,
    Alert,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { FiTrash2, FiUpload } from 'react-icons/fi';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploadWithCropProps {
    onChangeImage: (url: string | undefined) => void;
    image?: string;
    disabled?: boolean;
    cropWidth?: number;
    cropHeight?: number;
    previewWidth?: number;
    previewHeight?: number;
    aspectRatio?: number;
    uploadEndpoint?: string;
    uploadHeaders?: Record<string, string>;
    label?: string;
    /** Formato de salida de la imagen recortada. 'jpeg' no soporta transparencia, 'png' sí. */
    outputFormat?: 'jpeg' | 'png';
    /** Calidad de salida para JPEG (0-1). Ignorado si outputFormat = 'png'. */
    outputQuality?: number;
}

export function ImageUploadWithCrop({
    onChangeImage,
    image,
    disabled = false,
    cropWidth = 300,
    cropHeight = 300,
    previewWidth = 120,
    previewHeight = 120,
    aspectRatio,
    uploadEndpoint = '/api/upload-image',
    uploadHeaders = {},
    label,
    outputFormat = 'jpeg',
    outputQuality = 0.92,
}: ImageUploadWithCropProps) {
    const finalAspectRatio = aspectRatio ?? cropWidth / cropHeight;

    const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(image);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string | undefined>(undefined);
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        width: 90,
        height: 90,
        x: 5,
        y: 5,
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        setCurrentImageUrl(image);
    }, [image]);

    const handleSelectFile = () => {
        if (!disabled && !currentImageUrl) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setTempImageSrc(reader.result as string);
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const createCenteredCrop = useCallback(
        (imgWidth: number, imgHeight: number): Crop => {
            let cropW, cropH, cropX, cropY;
            if (imgWidth / imgHeight > finalAspectRatio) {
                cropH = imgHeight;
                cropW = cropH * finalAspectRatio;
                cropX = (imgWidth - cropW) / 2;
                cropY = 0;
            } else {
                cropW = imgWidth;
                cropH = cropW / finalAspectRatio;
                cropX = 0;
                cropY = (imgHeight - cropH) / 2;
            }
            return {
                unit: 'px',
                width: cropW,
                height: cropH,
                x: cropX,
                y: cropY,
            };
        },
        [finalAspectRatio]
    );

    const pxToPercentCrop = useCallback((pixelCrop: Crop, imgWidth: number, imgHeight: number): Crop => {
        return {
            unit: '%',
            width: (pixelCrop.width / imgWidth) * 100,
            height: (pixelCrop.height / imgHeight) * 100,
            x: (pixelCrop.x / imgWidth) * 100,
            y: (pixelCrop.y / imgHeight) * 100,
        };
    }, []);

    const handleImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget;
            (imgRef as any).current = img;
            const pixelCrop = createCenteredCrop(img.width, img.height);
            const percentCrop = pxToPercentCrop(pixelCrop, img.width, img.height);
            setCrop(percentCrop);
        },
        [createCenteredCrop, pxToPercentCrop]
    );

    const handleCropAndUpload = useCallback(async () => {
        if (!imgRef.current) return;

        const imageElement = imgRef.current;
        const canvas = document.createElement('canvas');

        let pixelCrop: { x: number; y: number; width: number; height: number };
        if (crop.unit === '%') {
            pixelCrop = {
                x: (crop.x * imageElement.width) / 100,
                y: (crop.y * imageElement.height) / 100,
                width: (crop.width * imageElement.width) / 100,
                height: (crop.height * imageElement.height) / 100,
            };
        } else {
            pixelCrop = crop as any;
        }

        const scaleX = imageElement.naturalWidth / imageElement.width;
        const scaleY = imageElement.naturalHeight / imageElement.height;

        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Nota: para PNG transparente, NO pintamos fondo sólido.
        // Así se mantiene el canal alfa cuando se usa 'image/png'.
        // Si se quiere forzar un fondo para JPEG, se podría añadir un rectángulo blanco aquí.
        // Pero como queremos preservar la transparencia, dejamos que ctx.drawImage copie los píxeles con su alfa.

        ctx.drawImage(
            imageElement,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Elegir formato y calidad según prop
        let mimeType: string;
        let quality: number | undefined;
        if (outputFormat === 'png') {
            mimeType = 'image/png';
            quality = undefined; // PNG ignora la calidad
        } else {
            mimeType = 'image/jpeg';
            quality = outputQuality;
        }

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, mimeType, quality)
        );
        if (!blob) {
            setStatusMessage({ type: 'error', text: 'No se pudo generar la imagen' });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setIsCropModalOpen(false);
        setStatusMessage(null);

        try {
            const formData = new FormData();
            // El nombre del archivo puede reflejar la extensión real
            const extension = outputFormat === 'png' ? 'png' : 'jpg';
            formData.append('image', blob, `cropped.${extension}`);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', uploadEndpoint);
            Object.entries(uploadHeaders).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                }
            };

            const uploadPromise = new Promise<string>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            const url = response.url;
                            if (!url) throw new Error('Respuesta inválida');
                            resolve(url);
                        } catch (err) {
                            reject(new Error('Respuesta inválida del servidor'));
                        }
                    } else {
                        reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Error de red'));
                xhr.send(formData);
            });

            const uploadedUrl = await uploadPromise;
            setCurrentImageUrl(uploadedUrl);
            onChangeImage(uploadedUrl);
            setStatusMessage({ type: 'success', text: 'Imagen subida correctamente' });
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (error: any) {
            console.error(error);
            setStatusMessage({ type: 'error', text: error.message });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setTempImageSrc(undefined);
        }
    }, [crop, cropWidth, cropHeight, uploadEndpoint, uploadHeaders, onChangeImage, outputFormat, outputQuality]);

    const handleDelete = () => {
        setCurrentImageUrl(undefined);
        onChangeImage(undefined);
    };

    return (
        <>
            <Box>
                <Paper
                    withBorder
                    radius="md"
                    style={{
                        width: previewWidth,
                        height: previewHeight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: !currentImageUrl && !disabled ? 'pointer' : 'default',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: currentImageUrl ? 'transparent' : 'var(--mantine-color-gray-0)',
                    }}
                    onClick={handleSelectFile}
                >
                    {!currentImageUrl ? (
                        <Stack align="center" gap={4} p="xs">
                            <FiUpload size={28} />
                            <Text size="xs" c="dimmed" ta="center">
                                {disabled ? 'Sin imagen' : label || 'Seleccionar imagen'}
                            </Text>
                        </Stack>
                    ) : (
                        <>
                            <Box
                                component="img"
                                src={currentImageUrl}
                                alt="Imagen"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <ActionIcon
                                color="red"
                                variant="filled"
                                radius="xl"
                                style={{ position: 'absolute', bottom: 8, right: 8 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                                disabled={disabled}
                            >
                                <FiTrash2 size={16} />
                            </ActionIcon>
                        </>
                    )}
                </Paper>

                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={disabled}
                />
            </Box>

            <Modal
                opened={isCropModalOpen}
                onClose={() => setIsCropModalOpen(false)}
                title="Recortar imagen"
                size="xl"
                centered
            >
                {tempImageSrc && (
                    <Box style={{ display: 'flex', justifyContent: 'center' }}>
                        <ReactCrop
                            crop={crop}
                            onChange={(newCrop) => setCrop(newCrop)}
                            aspect={finalAspectRatio}
                            circularCrop={false}
                        >
                            <img
                                src={tempImageSrc}
                                alt="Recorte"
                                onLoad={handleImageLoad}
                                style={{ maxHeight: '60vh', maxWidth: '100%' }}
                            />
                        </ReactCrop>
                    </Box>
                )}
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setIsCropModalOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleCropAndUpload}>Guardar y subir</Button>
                </Group>
            </Modal>

            {isUploading && (
                <Box mt="xs">
                    <Progress value={uploadProgress} size="sm" animated />
                    <Text size="xs" ta="center" mt={4}>
                        Subiendo {uploadProgress}%
                    </Text>
                </Box>
            )}

            {statusMessage && (
                <Alert color={statusMessage.type === 'success' ? 'green' : 'red'} mt="xs" withCloseButton onClose={() => setStatusMessage(null)}>
                    {statusMessage.text}
                </Alert>
            )}
        </>
    );
}