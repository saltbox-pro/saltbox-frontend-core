/**
 * Схема объекта `meta` для подсказок и подсветки ошибок в текстовом редакторе.
 * Бекенд машиночитаемой версии не отдаёт, поэтому описание держим здесь;
 * `additionalProperties` оставлены открытыми, чтобы новые поля бекенда не
 * подсвечивались как ошибка.
 */
export const TEMPLATE_META_SCHEMA_URI = "saltbox://schemas/task-template-meta.json";

export const TEMPLATE_META_MODEL_PATH = "task-template-meta.json";

const localizedText = {
  type: "object",
  additionalProperties: { type: "string" },
};

export const TEMPLATE_META_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: true,
  properties: {
    fun: {
      type: "string",
      description:
        "Salt-функция шаблона. Для state.apply шаблон использует .sls-файл, остальные вызывают функцию напрямую.",
    },
    query: {
      type: "object",
      description:
        "Предустановленный фильтр минионов (MongoQuery). Пустой объект — без ограничения.",
      additionalProperties: true,
    },
    title: {
      description: "Название шаблона. Показывается в списках шаблонов и в форме создания задачи.",
      anyOf: [{ type: "string" }, localizedText],
    },
    description: {
      description: "Описание шаблона. Помогает выбрать шаблон перед запуском задачи.",
      anyOf: [{ type: "string" }, localizedText],
    },
    json_schema: {
      type: "object",
      description: "Схема данных и валидации формы. Пользовательских текстов здесь быть не должно.",
      additionalProperties: true,
    },
    ui_schema: {
      type: "object",
      description: "Оформление формы. Подписи задаются плейсхолдерами {{ключ}} из блока i18n.",
      additionalProperties: true,
    },
    i18n: {
      type: "object",
      description: 'Переводы плейсхолдеров по языкам: { "ru": { "ключ": "текст" } }.',
      additionalProperties: localizedText,
    },
    defaults: {
      description: "Дефолты запуска задачи. Пользователь может переопределить их при старте.",
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        batch_size: {
          type: ["integer", "null"],
          minimum: 0,
          description: "Размер батча минионов за раз.",
        },
        max_jobs_count_at_same_time: {
          type: ["integer", "null"],
          minimum: 1,
          description: "Максимальное число параллельных джобов.",
        },
        max_retries: {
          type: ["integer", "null"],
          minimum: 0,
          description: "Число повторов при ошибке.",
        },
        retry_delay: {
          type: ["integer", "null"],
          minimum: 0,
          description: "Пауза между повторами, секунды.",
        },
        ttl: {
          type: ["integer", "null"],
          minimum: 0,
          description: "TTL джоба в секундах. Верхний предел задаётся настройками сервиса.",
        },
      },
    },
    secret_pillars: {
      type: "array",
      description: "Имена параметров формы, значения которых шифруются at-rest, например token.",
      items: { type: "string" },
    },
  },
} as const;
