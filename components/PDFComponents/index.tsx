import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

// Estilos base
const baseStyles = StyleSheet.create({
    flexRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    flexCol: {
        flexDirection: 'column',
    },
    textBase: {
        fontSize: 10,
        fontFamily: 'Open Sans',
    },
});

// Helper para convertir strings de tamaño a números (ej "12px" -> 12)
const parseSize = (size: string | number | undefined): number | undefined => {
    if (typeof size === 'number') return size;
    if (typeof size === 'string') {
        const match = size.match(/\d+/);
        return match ? parseInt(match[0]) : undefined;
    }
    return undefined;
};

// ============================================================
// FlexPDF - Contenedor flexible (por defecto en fila)
// ============================================================
interface FlexProps {
    children: React.ReactNode;
    direction?: 'row' | 'column';
    wrap?: 'wrap' | 'nowrap';
    gap?: number;
    align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    flex?: number | 'initial';
    bg?: string;
    style?: any;
}

export const FlexPDF: React.FC<FlexProps> = ({
    children,
    direction = 'row',
    wrap = 'nowrap',
    gap = 0,
    align = 'flex-start',
    justify = 'flex-start',
    flex,
    bg,
    style,
}) => {
    const flexStyle: any = {
        flexDirection: direction,
        flexWrap: wrap === 'wrap' ? 'wrap' : 'nowrap',
        gap,
        alignItems: align,
        justifyContent: justify,
        ...(flex !== undefined && { flex }),
        ...(bg && { backgroundColor: bg }),
    };
    return (
        <View style={[baseStyles.flexRow, flexStyle, style]}>
            {children}
        </View>
    );
};

// ============================================================
// StackPDF - Contenedor en columna (sin flex por defecto)
// ============================================================
interface StackProps {
    children: React.ReactNode;
    flex?: number | 'initial';
    gap?: number;
    align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    bg?: string;
    style?: any;
}

export const StackPDF: React.FC<StackProps> = ({
    children,
    flex,
    gap = 0,
    align = 'stretch',
    justify = 'flex-start',
    bg,
    style,
}) => {
    const stackStyle: any = {
        flexDirection: 'column',
        gap,
        alignItems: align,
        justifyContent: justify,
        ...(flex !== undefined && { flex }),
        ...(bg && { backgroundColor: bg }),
    };
    return (
        <View style={[stackStyle, style]}>
            {children}
        </View>
    );
};

// ============================================================
// TextPDF - Texto con estilos comunes
// ============================================================
interface TextProps {
    children: React.ReactNode;
    fontSize?: number | string;
    fontWeight?: number | string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    bold?: boolean;
    small?: boolean;
    style?: any;
    [key: string]: any;
}

export const TextPDF: React.FC<TextProps> = ({
    children,
    fontSize,
    fontWeight,
    color,
    textAlign,
    bold,
    small,
    style,
    ...rest
}) => {
    const numericFontSize = parseSize(fontSize);
    const numericFontWeight = parseSize(fontWeight);
    const finalFontWeight = bold ? 700 : (numericFontWeight || 400);
    const finalFontSize = small ? 8 : (numericFontSize || 10);

    const textStyle: any = {
        fontSize: finalFontSize,
        fontWeight: finalFontWeight,
        color,
        textAlign,
    };
    return (
        <Text style={[baseStyles.textBase, textStyle, style]} {...rest}>
            {children}
        </Text>
    );
};

// ============================================================
// DividerPDF - Línea separadora
// ============================================================
interface DividerProps {
    marginVertical?: number;
    color?: string;
    thickness?: number;
}

export const DividerPDF: React.FC<DividerProps> = ({
    marginVertical = 8,
    color = '#e5e7eb',
    thickness = 1,
}) => {
    return (
        <View
            style={{
                marginVertical,
                borderBottomWidth: thickness,
                borderBottomColor: color,
            }}
        />
    );
};

// ============================================================
// Column - Componente de ayuda para secciones con título
// ============================================================
interface ColumnProps {
    title: string;
    children: React.ReactNode;
    primaryColor: string;
    textColor: string;
    flex?: number;
}

export const Column: React.FC<ColumnProps> = ({
    title,
    children,
    primaryColor,
    textColor,
    flex = 1,
}) => {
    return (
        <StackPDF flex={flex} gap={0} style={{ color: textColor }}>
            <TextPDF
                bold
                fontSize={10}
                style={{ color: primaryColor, borderBottom: '1px solid #e6e3e3', padding: '4px 0px' }}
            >
                {title}
            </TextPDF>
            {children}
        </StackPDF>
    );
};

// ============================================================
// Row - Componente para cada línea dentro de Column
// ============================================================
interface RowProps {
    children: React.ReactNode;
    color?: string;
    style?: any;
    [key: string]: any;
}

export const Row: React.FC<RowProps> = ({
    children,
    color,
    style,
    ...rest
}) => {
    return (
        <TextPDF style={[{ padding: '1px 0px' }, style]} fontSize="9px" color={color} {...rest}>
            {children}
        </TextPDF>
    );
};