import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { rootRouterConfig } from './app.routes';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';

import { HomeComponent } from './home/home.component';
import { PlayComponent } from './play/play.component';
import { ProfileComponent } from './profile/profile.component';
import { StatsComponent } from './stats/stats.component';
import { LoginComponent } from './login/login.component';

import { StorageService } from './shared/session-storage.service';
import { SortingCharacterPipe } from './shared/SortingCharacterPipe'
import { SessionGuard } from './shared/session-guard.service'
import { PlayGuard } from './shared/play-guard.service'
import { UserResolver } from './shared/user-resolver.service';
import { ApiService } from './shared/api.service';
import { UserService } from './user/user.service';

import { NgProgressModule, NgProgressInterceptor } from 'ngx-progressbar';
import { ChartsModule } from 'ng2-charts';


@NgModule({ //PIE CHART: https://www.npmjs.com/package/ng2modules-easypiechart
  declarations: [
    AppComponent,
    HomeComponent,
    PlayComponent,
    ProfileComponent,
    StatsComponent,
    LoginComponent,
    SortingCharacterPipe,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgProgressModule,
    ChartsModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: true })
  ],
  providers: [
    StorageService,
    ApiService,
    UserService,
    SessionGuard,
    PlayGuard,
    UserResolver,
    { provide: HTTP_INTERCEPTORS, useClass: NgProgressInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
