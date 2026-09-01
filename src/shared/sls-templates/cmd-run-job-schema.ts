import type { BuiltinJobSchemaMeta } from "./types";

export const CMD_RUN_JOB_SCHEMA: BuiltinJobSchemaMeta = {
  name: "cmd.run",
  title: "{{title}}",
  description: "{{description}}",
  fun: "cmd.run",
  json_schema: {
    type: "object",
    properties: {
      kwargs: {
        type: "object",
        required: ["cmd"],
        properties: {
          cmd: {
            type: "string",
            examples: ["ls -la", "grep 'err' /var/log/syslog", "echo 'test' > /tmp/file"],
          },
          cwd: {
            type: "string",
            pattern:
              '^(?!.*?\\\\\\\\)(?!.*?\\/\\/)(?!.*\\\\.*\\/)(?!.*\\/.*\\\\)(?:[a-zA-Z]:\\\\|\\/)[^<>:,"|?*\\0\\r\\n]*$',
            examples: ["/", "/var/www/html", "C:\\Temp", "/tmp"],
          },
          stdin: {
            type: "string",
            examples: ["input_string", "line1\\nline2", "data"],
          },
          runas: {
            type: "string",
            examples: ["root", "nobody", "www-data", "system"],
          },
          group: {
            type: "string",
            examples: ["users", "lp", "sys"],
          },
          shell: {
            type: "string",
            pattern:
              '^(?!.*?\\\\\\\\)(?!.*?\\/\\/)(?!.*\\\\.*\\/)(?!.*\\/.*\\\\)(?:(?:[a-zA-Z]:\\\\|\\/)[^<>:,"|?*\\0\\r\\n]+[^\\/\\\\]|[a-zA-Z0-9]+)$',
            examples: ["/bin/bash", "/bin/python3", "/bin/sh", "cmd", "powershell"],
          },
          python_shell: {
            type: "boolean",
          },
          env: {
            type: "object",
            additionalProperties: {
              type: "string",
              default: "",
            },
            propertyNames: {
              pattern: "^[A-Za-z_][A-Za-z0-9_]*$",
            },
          },
          clean_env: {
            type: "boolean",
            default: false,
          },
          template: {
            type: "string",
            enum: ["jinja", "mako", "wempy"],
          },
          rstrip: {
            type: "boolean",
            default: true,
          },
          umask: {
            type: "string",
            pattern: "^0?[0-7]{1,3}$",
            examples: ["022", "077", "0002"],
          },
          output_encoding: {
            type: "string",
            pattern: "^[a-zA-Z0-9_-]+$",
            examples: ["utf-8", "cp1251", "ascii"],
          },
          output_loglevel: {
            type: "string",
            default: "debug",
            oneOf: [
              {
                const: "all",
              },
              {
                const: "debug",
              },
              {
                const: "error",
              },
              {
                const: "critical",
              },
              {
                const: "garbage",
              },
              {
                const: "info",
              },
              {
                const: "profile",
              },
              {
                const: "quiet",
              },
              {
                const: "trace",
              },
              {
                const: "warning",
              },
            ],
          },
          log_callback: {
            type: "string",
            examples: ["my_custom_mod.my_log_handler", "logging_utils.stream_processor"],
          },
          hide_output: {
            type: "boolean",
            default: false,
          },
          timeout: {
            type: "integer",
            minimum: 0,
            examples: [10, 60, 300],
          },
          reset_system_locale: {
            type: "boolean",
            default: true,
          },
          ignore_retcode: {
            type: "boolean",
            default: false,
          },
          saltenv: {
            type: "string",
            pattern: "^(?:_+[a-zA-Z0-9]|[a-zA-Z])[\\w-]*(?:,(?:_+[a-zA-Z0-9]|[a-zA-Z])[\\w-]*)*$",
            examples: ["base", "production", "dev,staging"],
          },
          use_vt: {
            type: "boolean",
            default: false,
          },
          redirect_stderr: {
            type: "boolean",
            default: true,
          },
          bg: {
            type: "boolean",
            default: false,
          },
          password: {
            type: "string",
          },
          encoded_cmd: {
            type: "boolean",
            default: false,
          },
          raise_err: {
            type: "boolean",
            default: false,
          },
          prepend_path: {
            type: "string",
            pattern:
              '^(?!.*?\\\\\\\\)(?!.*?\\/\\/)(?!.*\\\\.*\\/)(?!.*\\/.*\\\\)(?:[a-zA-Z]:\\\\|\\/)[^<>:,"|?*\\0\\r\\n]*$',
            examples: ["/usr/local/bin", "/opt/custom/bin", "C:\\Program Files\\CustomApp\\bin"],
          },
          success_retcodes: {
            type: "array",
            items: {
              type: "integer",
            },
          },
          success_stdout: {
            type: "array",
            items: {
              type: "string",
              examples: [
                "Success",
                "Completed successfully",
                "Everything is up to date",
                "No changes required",
                "Nothing to do",
              ],
            },
          },
          success_stderr: {
            type: "array",
            items: {
              type: "string",
              examples: [
                "already exists",
                "warning:",
                "update not needed",
                "File exists",
                "Directory not empty",
              ],
            },
          },
        },
      },
    },
  },
  ui_schema: {
    kwargs: {
      cmd: {
        "ui:title": "{{kwargs_cmd_title}}",
        "ui:description": "{{kwargs_cmd_description}}",
      },
      cwd: {
        "ui:title": "{{kwargs_cwd_title}}",
        "ui:description": "{{kwargs_cwd_description}}",
      },
      stdin: {
        "ui:title": "{{kwargs_stdin_title}}",
        "ui:description": "{{kwargs_stdin_description}}",
      },
      runas: {
        "ui:title": "{{kwargs_runas_title}}",
        "ui:description": "{{kwargs_runas_description}}",
      },
      group: {
        "ui:title": "{{kwargs_group_title}}",
        "ui:description": "{{kwargs_group_description}}",
      },
      shell: {
        "ui:title": "{{kwargs_shell_title}}",
        "ui:description": "{{kwargs_shell_description}}",
      },
      python_shell: {
        "ui:title": "{{kwargs_python_shell_title}}",
        "ui:description": "{{kwargs_python_shell_description}}",
        "ui:widget": "select",
      },
      env: {
        "ui:title": "{{kwargs_env_title}}",
        "ui:description": "{{kwargs_env_description}}",
        additionalProperties: {
          "ui:label": false,
        },
      },
      clean_env: {
        "ui:title": "{{kwargs_clean_env_title}}",
        "ui:description": "{{kwargs_clean_env_description}}",
        "ui:widget": "select",
      },
      template: {
        "ui:title": "{{kwargs_template_title}}",
        "ui:description": "{{kwargs_template_description}}",
      },
      rstrip: {
        "ui:title": "{{kwargs_rstrip_title}}",
        "ui:description": "{{kwargs_rstrip_description}}",
        "ui:widget": "select",
      },
      umask: {
        "ui:title": "{{kwargs_umask_title}}",
        "ui:description": "{{kwargs_umask_description}}",
      },
      output_encoding: {
        "ui:title": "{{kwargs_output_encoding_title}}",
        "ui:description": "{{kwargs_output_encoding_description}}",
      },
      output_loglevel: {
        "ui:title": "{{kwargs_output_loglevel_title}}",
        "ui:description": "{{kwargs_output_loglevel_description}}",
        "ui:widget": "select",
        oneOf_0: {
          "ui:title": "{{kwargs_output_loglevel_oneof_0_title}}",
        },
        oneOf_1: {
          "ui:title": "{{kwargs_output_loglevel_oneof_1_title}}",
        },
        oneOf_2: {
          "ui:title": "{{kwargs_output_loglevel_oneof_2_title}}",
        },
        oneOf_3: {
          "ui:title": "{{kwargs_output_loglevel_oneof_3_title}}",
        },
        oneOf_4: {
          "ui:title": "{{kwargs_output_loglevel_oneof_4_title}}",
        },
        oneOf_5: {
          "ui:title": "{{kwargs_output_loglevel_oneof_5_title}}",
        },
        oneOf_6: {
          "ui:title": "{{kwargs_output_loglevel_oneof_6_title}}",
        },
        oneOf_7: {
          "ui:title": "{{kwargs_output_loglevel_oneof_7_title}}",
        },
        oneOf_8: {
          "ui:title": "{{kwargs_output_loglevel_oneof_8_title}}",
        },
        oneOf_9: {
          "ui:title": "{{kwargs_output_loglevel_oneof_9_title}}",
        },
      },
      log_callback: {
        "ui:title": "{{kwargs_log_callback_title}}",
        "ui:description": "",
      },
      hide_output: {
        "ui:title": "{{kwargs_hide_output_title}}",
        "ui:description": "{{kwargs_hide_output_description}}",
        "ui:widget": "select",
      },
      timeout: {
        "ui:title": "{{kwargs_timeout_title}}",
        "ui:description": "{{kwargs_timeout_description}}",
      },
      reset_system_locale: {
        "ui:title": "{{kwargs_reset_system_locale_title}}",
        "ui:description": "",
        "ui:widget": "select",
      },
      ignore_retcode: {
        "ui:title": "{{kwargs_ignore_retcode_title}}",
        "ui:description": "{{kwargs_ignore_retcode_description}}",
        "ui:widget": "select",
      },
      saltenv: {
        "ui:title": "{{kwargs_saltenv_title}}",
        "ui:description": "",
      },
      use_vt: {
        "ui:title": "{{kwargs_use_vt_title}}",
        "ui:description": "{{kwargs_use_vt_description}}",
        "ui:widget": "select",
      },
      redirect_stderr: {
        "ui:title": "{{kwargs_redirect_stderr_title}}",
        "ui:description": "{{kwargs_redirect_stderr_description}}",
        "ui:widget": "select",
      },
      bg: {
        "ui:title": "{{kwargs_bg_title}}",
        "ui:description": "{{kwargs_bg_description}}",
        "ui:widget": "select",
      },
      password: {
        "ui:title": "{{kwargs_password_title}}",
        "ui:description": "{{kwargs_password_description}}",
        "ui:widget": "password",
      },
      encoded_cmd: {
        "ui:title": "{{kwargs_encoded_cmd_title}}",
        "ui:description": "{{kwargs_encoded_cmd_description}}",
        "ui:widget": "select",
      },
      raise_err: {
        "ui:title": "{{kwargs_raise_err_title}}",
        "ui:description": "{{kwargs_raise_err_description}}",
        "ui:widget": "select",
      },
      prepend_path: {
        "ui:title": "{{kwargs_prepend_path_title}}",
        "ui:description": "{{kwargs_prepend_path_description}}",
      },
      success_retcodes: {
        "ui:title": "{{kwargs_success_retcodes_title}}",
        "ui:description": "{{kwargs_success_retcodes_description}}",
        items: {
          "ui:label": false,
        },
      },
      success_stdout: {
        "ui:title": "{{kwargs_success_stdout_title}}",
        "ui:description": "{{kwargs_success_stdout_description}}",
        items: {
          "ui:label": false,
        },
      },
      success_stderr: {
        "ui:title": "{{kwargs_success_stderr_title}}",
        "ui:description": "{{kwargs_success_stderr_description}}",
        items: {
          "ui:label": false,
        },
      },
    },
  },
  i18n: {
    en: {
      kwargs_output_loglevel_oneof_0_title: "All",
      kwargs_output_loglevel_oneof_1_title: "Debug",
      kwargs_output_loglevel_oneof_2_title: "Error",
      kwargs_output_loglevel_oneof_3_title: "Critical",
      kwargs_output_loglevel_oneof_4_title: "Garbage",
      kwargs_output_loglevel_oneof_5_title: "Info",
      kwargs_output_loglevel_oneof_6_title: "Profile",
      kwargs_output_loglevel_oneof_7_title: "Quiet",
      kwargs_output_loglevel_oneof_8_title: "Trace",
      kwargs_output_loglevel_oneof_9_title: "Warning",
      kwargs_cmd_title: "Cmd",
      kwargs_cmd_description: "The command to run. ex: ls -lart /home",
      kwargs_cwd_title: "Cwd",
      kwargs_cwd_description:
        "The directory from which to execute the command. Defaults to the home directory of the user specified by runas (or the user under which Salt is running if runas is not specified)",
      kwargs_stdin_title: "Standard input",
      kwargs_stdin_description:
        "A string of standard input can be specified for the command to be run using the stdin parameter. This can be useful in cases where sensitive information must be read from standard input",
      kwargs_runas_title: "Run as",
      kwargs_runas_description:
        "Specify an alternate user to run the command. The default behavior is to run as the user under which Salt is running",
      kwargs_group_title: "Group",
      kwargs_group_description: "Group to run command as. Not currently supported on Windows",
      kwargs_shell_title: "Shell",
      kwargs_shell_description:
        "Specify an alternate shell. Defaults to the system's default shell",
      kwargs_python_shell_title: "Python shell",
      kwargs_python_shell_description:
        "If False, let python handle the positional arguments. Set to True to use shell features, such as pipes or redirection",
      kwargs_env_title: "Environment",
      kwargs_env_description: "Environment variables to be set prior to execution",
      kwargs_clean_env_title: "Clean environment",
      kwargs_clean_env_description:
        "Attempt to clean out all other shell environment variables and set only those provided in the 'env' argument to this function",
      kwargs_template_title: "Template",
      kwargs_template_description:
        "If this setting is applied then the named templating engine will be used to render the downloaded file. Currently jinja, mako, and wempy are supported",
      kwargs_rstrip_title: "Rstrip",
      kwargs_rstrip_description: "Strip all whitespace off the end of output before it is returned",
      kwargs_umask_title: "Umask",
      kwargs_umask_description: "The umask (in octal) to use when running the command",
      kwargs_output_encoding_title: "Output encoding",
      kwargs_output_encoding_description:
        "Control the encoding used to decode the command's output",
      kwargs_output_loglevel_title: "Output loglevel",
      kwargs_output_loglevel_description:
        "Control the loglevel at which the output from the command is logged to the minion log",
      kwargs_log_callback_title: "Log callback",
      kwargs_hide_output_title: "Hide output",
      kwargs_hide_output_description: "If True, suppress stdout and stderr in the return data",
      kwargs_timeout_title: "Timeout",
      kwargs_timeout_description: "A timeout in seconds for the executed process to return",
      kwargs_reset_system_locale_title: "Reset system locale",
      kwargs_ignore_retcode_title: "Ignore retcode",
      kwargs_ignore_retcode_description:
        "If the exit code of the command is nonzero, this is treated as an error condition, and the output from the command will be logged to the minion log. However, there are some cases where programs use the return code for signaling and a nonzero exit code doesn't necessarily mean failure. Pass this argument as True to skip logging the output if the command has a nonzero exit code",
      kwargs_saltenv_title: "Salt environment",
      kwargs_use_vt_title: "VT utils",
      kwargs_use_vt_description:
        "Use VT utils (saltstack) to stream the command output more interactively to the console and the logs. This is experimental",
      kwargs_redirect_stderr_title: "Redirect_stderr",
      kwargs_redirect_stderr_description:
        "If set to True, then stderr will be redirected to stdout. This is helpful for cases where obtaining both the retcode and output is desired. Default is True",
      kwargs_bg_title: "Bg",
      kwargs_bg_description:
        "If True, run command in background and do not await or deliver its results",
      kwargs_password_title: "Password",
      kwargs_password_description:
        "Windows only. Required when specifying runas. This parameter will be ignored on non-Windows platforms",
      kwargs_encoded_cmd_title: "Encoded cmd",
      kwargs_encoded_cmd_description:
        "Specify if the supplied command is encoded. Only applies to shell 'powershell' and 'pwsh'",
      kwargs_raise_err_title: "Raise error",
      kwargs_raise_err_description:
        "If True and the command has a nonzero exit code, a CommandExecutionError exception will be raised",
      kwargs_prepend_path_title: "Prepend path",
      kwargs_prepend_path_description:
        "$PATH segment to prepend (trailing ':' not necessary) to $PATH",
      kwargs_success_retcodes_title: "Success return codes",
      kwargs_success_retcodes_description:
        "This parameter will allow a list of non-zero return codes that should be considered a success.  If the return code returned from the run matches any in the provided list, the return code will be overridden with zero",
      kwargs_success_stdout_title: "Success standard output",
      kwargs_success_stdout_description:
        "This parameter will allow a list of strings that when found in standard out should be considered a success. If stdout returned from the run matches any in the provided list, the return code will be overridden with zero",
      kwargs_success_stderr_title: "Success standard error",
      kwargs_success_stderr_description:
        "This parameter will allow a list of strings that when found in standard error should be considered a success. If stderr returned from the run matches any in the provided list, the return code will be overridden with zero",
      title: "cmd.run",
      description: "Execute the passed command and return the output as a string",
    },
    ru: {
      kwargs_output_loglevel_oneof_0_title: "Все",
      kwargs_output_loglevel_oneof_1_title: "Debug",
      kwargs_output_loglevel_oneof_2_title: "Error",
      kwargs_output_loglevel_oneof_3_title: "Critical",
      kwargs_output_loglevel_oneof_4_title: "Garbage",
      kwargs_output_loglevel_oneof_5_title: "Info",
      kwargs_output_loglevel_oneof_6_title: "Profile",
      kwargs_output_loglevel_oneof_7_title: "Quiet",
      kwargs_output_loglevel_oneof_8_title: "Trace",
      kwargs_output_loglevel_oneof_9_title: "Warning",
      kwargs_cmd_title: "Cmd",
      kwargs_cmd_description: "Команда для запуска. например: ls -lart /home",
      kwargs_cwd_title: "Cwd",
      kwargs_cwd_description:
        "Каталог, из которого нужно выполнить команду. По умолчанию используется домашний каталог пользователя, указанного runas (или пользователя, под которым запущен Salt, если runas не указан)",
      kwargs_stdin_title: "Стандартный ввод",
      kwargs_stdin_description:
        "Строка стандартного ввода может быть указана для команды, которая будет выполняться с использованием параметра stdin. Это может быть полезно в тех случаях, когда конфиденциальная информация должна считываться со стандартного ввода",
      kwargs_runas_title: "& Запустить как:",
      kwargs_runas_description:
        "Укажите альтернативного пользователя для выполнения команды. По умолчанию поведение должно выполняться как пользователь, под которым работает Salt",
      kwargs_group_title: "Group",
      kwargs_group_description:
        "Группа для выполнения команды как. В настоящее время не поддерживается в Windows",
      kwargs_shell_title: "Shell",
      kwargs_shell_description:
        "Укажите альтернативную оболочку. Значения по умолчанию для системной оболочки по умолчанию",
      kwargs_python_shell_title: "Оболочка Python",
      kwargs_python_shell_description:
        "Если False, пусть Python обрабатывает позиционные аргументы. Установите значение True, чтобы использовать функции оболочки, такие как каналы или перенаправление",
      kwargs_env_title: "Environment",
      kwargs_env_description: "Переменные среды, которые должны быть установлены перед выполнением",
      kwargs_clean_env_title: "Чистая среда",
      kwargs_clean_env_description:
        "Попытайтесь очистить все другие переменные среды оболочки и установить для этой функции только те, которые указаны в аргументе 'env'",
      kwargs_template_title: "Template",
      kwargs_template_description:
        "Если этот параметр применен, то для отображения загруженного файла будет использоваться именованный шаблонный движок. В настоящее время поддерживаются jinja, mako и wempy",
      kwargs_rstrip_title: "Rstrip",
      kwargs_rstrip_description:
        "Удалите все пробелы с конца вывода, прежде чем он будет возвращен",
      kwargs_umask_title: "Umask",
      kwargs_umask_description:
        "Умаска (в восьмеричной системе), используемая при выполнении команды",
      kwargs_output_encoding_title: "Кодировка вывода:",
      kwargs_output_encoding_description:
        "Управление кодировкой, используемой для декодирования выходных данных команды",
      kwargs_output_loglevel_title: "Выход loglevel",
      kwargs_output_loglevel_description:
        "Управляйте уровнем logle, при котором вывод команды регистрируется в журнале миньонов",
      kwargs_log_callback_title: "Записать обратный вызов",
      kwargs_hide_output_title: "Скрыть вывод",
      kwargs_hide_output_description:
        "Если установлено значение True (Истина), подавить stdout и stderr в данных возврата",
      kwargs_timeout_title: "Timeout",
      kwargs_timeout_description: "Таймаут в секундах для возврата выполненного процесса",
      kwargs_reset_system_locale_title: "Сброс локали системы",
      kwargs_ignore_retcode_title: "Игнорировать реткод",
      kwargs_ignore_retcode_description:
        "Если код выхода команды отличен от нуля, это рассматривается как условие ошибки, и вывод команды будет зарегистрирован в журнале миньонов. Однако есть некоторые случаи, когда программы используют код возврата для сигнализации, и ненулевой код выхода не обязательно означает сбой. Передайте этому аргументу значение True, чтобы пропустить запись выходных данных, если команда имеет ненулевой код выхода",
      kwargs_saltenv_title: "Солевая среда",
      kwargs_use_vt_title: "VT Utils",
      kwargs_use_vt_description:
        "Используйте утилиты VT (соляной стек) для более интерактивного потокового вывода команд в консоль и журналы. Это экспериментальный",
      kwargs_redirect_stderr_title: "Redirect_stderr",
      kwargs_redirect_stderr_description:
        "Если установлено значение True (Истина), то stderr будет перенаправлен на stdout. Это полезно для случаев, когда требуется получение как реткода, так и вывода. Значение по умолчанию - True",
      kwargs_bg_title: "Bg",
      kwargs_bg_description:
        "Если установлено значение True (Истина), запустите команду в фоновом режиме и не ждите и не выдавайте ее результаты",
      kwargs_password_title: "Password",
      kwargs_password_description:
        "Только Windows. Обязательно при указании runas. Этот параметр будет игнорироваться на платформах, отличных от Windows",
      kwargs_encoded_cmd_title: "Кодированный cmd",
      kwargs_encoded_cmd_description:
        "Укажите, закодирована ли предоставленная команда. Применяется только к командной оболочке 'powershell' и 'pwsh'",
      kwargs_raise_err_title: "Ошибка поднятия",
      kwargs_raise_err_description:
        "Если True (Истина) и команда имеет ненулевой код выхода, будет создано исключение CommandExecutionError",
      kwargs_prepend_path_title: "Путь добавления",
      kwargs_prepend_path_description:
        "$PATH segment to prepend (trailing ':' not necessary) to $PATH",
      kwargs_success_retcodes_title: "Коды успешного возврата",
      kwargs_success_retcodes_description:
        "Этот параметр позволит создать список ненулевых кодов возврата, которые следует считать успешными.  Если код возврата, возвращенный из прогона, совпадает с любым в предоставленном списке, код возврата будет переопределен с нулем",
      kwargs_success_stdout_title: "Стандартный результат успеха",
      kwargs_success_stdout_description:
        "Этот параметр позволит составить список строк, которые при обнаружении в стандарте должны считаться успешными. Если stdout, возвращенный из прогона, совпадает с любым в предоставленном списке, код возврата будет переопределен с нулем",
      kwargs_success_stderr_title: "Стандартная ошибка успеха",
      kwargs_success_stderr_description:
        "Этот параметр позволит создать список строк, которые при обнаружении в стандартной ошибке должны считаться успешными. Если stderr, возвращенный из прогона, совпадает с любым в предоставленном списке, код возврата будет переопределен с нулем",
      title: "cmd.run",
      description: "Выполните переданную команду и верните вывод в виде строки",
    },
  },
};
