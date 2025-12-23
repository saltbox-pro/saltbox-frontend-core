import { makeAutoObservable } from "mobx";

const defaultSls = `{#start_schema
{
  "json_schema": {
    "type": "object",
    "title": "Base - System - Reboot module",
    "additionalProperties": false,
    "required": ["kwargs"],
    "properties": {
      "kwargs": {
        "type": "object",
        "additionalProperties": false,
        "required": ["pillar"],
        "properties": {
          "pillar": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "timeout": {
                "type": "integer",
                "default": 1,
                "minimum": 1
              }
            }
          }
        }
      }
    }
  },
  "ui_schema": {
    "kwargs": {
      "ui:title": "",
      "pillar": {
        "ui:title": "",
        "timeout": {
          "ui:title": "Sets the timeout period before shutdown in minutes"
        }
      }
    }
  }
}
end_schema#}
{% set timeout = pillar.timeout | int %}

System reboot:
module.run:
- system.reboot:
{% if grains.kernel == 'Linux' %}
{# Linux only supports minutes #}
- at_time: {{ timeout }}
{% elif grains.kernel == 'Windows' %}
- timeout: {{ timeout }}
- in_seconds: False
{% endif %}`;

export class SlsEditorStore {
  slsContent: string;

  constructor() {
    makeAutoObservable(this);
    this.slsContent = defaultSls;
  }

  setSlsContent = (content: string) => {
    this.slsContent = content;
  };

  clearSlsContent = () => {
    this.slsContent = defaultSls;
  };
}

export const slsEditorStore = new SlsEditorStore();
