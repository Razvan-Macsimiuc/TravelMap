import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { CountryService } from './country.service';
import {
  type Birthplace,
  BIRTHPLACE_STORAGE_KEY,
  isValidBirthplace,
} from '../models/birthplace.model';

@Injectable({ providedIn: 'root' })
export class BirthplaceService {
  private readonly storage = inject(StorageService);
  private readonly countryService = inject(CountryService);
  private readonly _record = signal<Birthplace | null>(null);

  /** Current birthplace after hydrate/save, or null. */
  readonly record = this._record.asReadonly();

  constructor() {
    void this.hydrate();
  }

  private async hydrate(): Promise<void> {
    const v = await this.storage.get<Birthplace>(BIRTHPLACE_STORAGE_KEY);
    this._record.set(v && isValidBirthplace(v) ? v : null);
  }

  async save(record: Birthplace): Promise<void> {
    if (!isValidBirthplace(record)) return;
    await this.countryService.initializationComplete;
    await this.storage.set(BIRTHPLACE_STORAGE_KEY, record);
    this._record.set(record);
    this.countryService.syncBirthplaceIntoTravelData(record);
  }

  async clear(): Promise<void> {
    await this.storage.remove(BIRTHPLACE_STORAGE_KEY);
    this._record.set(null);
  }
}
