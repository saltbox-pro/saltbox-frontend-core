import { OptionList } from 'react-querybuilder';
import { makeObservable } from 'mobx';
import { FilterStore } from '@saltbox/saltbox-frontend-common';

export class JobFilterStore extends FilterStore {
  constructor(schema: OptionList) {
    super();
    this.filterSchema = schema;
    makeObservable(this);
  }
}
