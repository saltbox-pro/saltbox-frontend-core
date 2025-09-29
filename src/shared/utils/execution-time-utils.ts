/**
 * Утилиты для работы с execution time и цветовой градацией
 */

export interface TimeUnits {
    milliseconds: string;
    seconds: string;
    minutes: string;
    hours: string;
}

/**
 * Форматирует время выполнения в читаемый вид с локализацией
 * @param executionTimeSeconds - время выполнения в секундах
 * @param timeUnits - объект с единицами времени для локализации
 * @returns отформатированная строка времени
 */
export const formatExecutionTime = (
    executionTimeSeconds: number,
    timeUnits: TimeUnits
): string => {
    if (executionTimeSeconds < 1) {
        const milliseconds = Math.round(executionTimeSeconds * 1000);
        return `${milliseconds}${timeUnits.milliseconds}`;
    } else if (executionTimeSeconds < 60) {
        return `${executionTimeSeconds.toFixed(2)}${timeUnits.seconds}`;
    } else if (executionTimeSeconds < 3600) {
        const minutes = Math.floor(executionTimeSeconds / 60);
        const seconds = (executionTimeSeconds % 60).toFixed(2);
        return `${minutes}${timeUnits.minutes} ${seconds}${timeUnits.seconds}`;
    } else {
        const hours = Math.floor(executionTimeSeconds / 3600);
        const minutes = Math.floor((executionTimeSeconds % 3600) / 60);
        const seconds = (executionTimeSeconds % 60).toFixed(2);
        return `${hours}${timeUnits.hours} ${minutes}${timeUnits.minutes} ${seconds}${timeUnits.seconds}`;
    }
};

export interface Statistics {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
}

/**
 * Функция для расчета статистических показателей
 * @param values - массив числовых значений
 * @returns объект со статистическими показателями
 */
export const calculateStatistics = (values: number[]): Statistics => {
    if (values.length === 0) {
        return { mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { mean, stdDev, min, max };
};

/**
 * Вспомогательная функция для получения цвета по нормализованному значению
 * @param normalizedValue - нормализованное значение от 0 до 1
 * @returns RGB цвет в формате строки
 */
export const getColorByNormalizedValue = (normalizedValue: number): string => {
    if (normalizedValue <= 0.5) {
        // От черного к желтому (0 - 0.5)
        const ratio = normalizedValue * 2; // 0-1
        const red = Math.round(0 + (255 - 0) * ratio); // 0 -> 255
        const green = Math.round(0 + (255 - 0) * ratio); // 0 -> 255
        const blue = Math.round(0 + (0 - 0) * ratio); // 0 -> 0
        return `rgb(${red}, ${green}, ${blue})`;
    } else {
        // От желтого к красному (0.5 - 1)
        const ratio = (normalizedValue - 0.5) * 2; // 0-1
        const red = 255; // остается 255
        const green = Math.round(255 - (255 - 0) * ratio); // 255 -> 0
        const blue = 0; // остается 0
        return `rgb(${red}, ${green}, ${blue})`;
    }
};

/**
 * Функция для расчета цвета на основе значения execution time с учетом дисперсии
 * @param value - значение execution time
 * @param mean - среднее значение
 * @param stdDev - стандартное отклонение
 * @param minValue - минимальное значение
 * @param maxValue - максимальное значение
 * @returns RGB цвет в формате строки
 */
export const getExecutionTimeColor = (
    value: number,
    mean: number,
    stdDev: number,
    minValue: number,
    maxValue: number
): string => {
    if (minValue === maxValue) {
        return '#000000'; // черный по умолчанию
    }

    // Если стандартное отклонение очень мало, используем простую градацию
    if (stdDev < 0.001) {
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        return getColorByNormalizedValue(normalizedValue);
    }

    // Вычисляем z-score (количество стандартных отклонений от среднего)
    const zScore = (value - mean) / stdDev;

    // Определяем цвет на основе z-score
    if (zScore <= 1) {
        // До 1 стандартного отклонения - черный
        return '#000000';
    } else if (zScore <= 2) {
        // От 1 до 2 стандартных отклонений - градиент от желтого к красному
        const ratio = (zScore - 1) / 1; // нормализуем от 0 до 1
        const red = Math.round(250 + (255 - 250) * ratio); // 250 -> 255
        const green = Math.round(173 + (77 - 173) * ratio); // 173 -> 77
        const blue = Math.round(20 + (79 - 20) * ratio); // 20 -> 79
        return `rgb(${red}, ${green}, ${blue})`;
    } else {
        // От 2 и выше стандартных отклонений - красный (danger)
        return '#ff4d4f';
    }
};
