import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import './index.css';

bootstrapApplication(AppComponent, { providers: [provideZonelessChangeDetection(), provideHttpClient()] }).catch(error => console.error(error));
