import './polyfills';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { LicenseManager } from 'ag-grid-enterprise/main';

LicenseManager.setLicenseKey('Evaluation_License_Valid_Until__16_June_2018__MTUyOTEwMzYwMDAwMA==adbba158d5a9934adfbe7a98950af2a4');
platformBrowserDynamic().bootstrapModule(AppModule).then(ref => {
  // Ensure Angular destroys itself on hot reloads.
  if (window['ngRef']) {
    window['ngRef'].destroy();
  }
  window['ngRef'] = ref;

  // Otherise, log the boot error
}).catch(err => console.error(err));