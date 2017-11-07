/*
  The login component validates user login, hopefully we can do this on the backend, if not I have the 
  pretty bad way that I do it here...
*/
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Subscription } from "rxjs";

import { ApiService } from '../shared/api.service';
import { StorageService } from '../shared/session-storage.service';
import { UserService } from '../user/user.service';

import { ICharacter_Class } from '../interfaces/Character_Class';
import { ICharacter } from '../interfaces/Character';
import { ICharacter_History } from '../interfaces/Character_History';
import { IUser } from '../user/user';

declare var window: any;

@Component({
  selector: 'login',
  styleUrls: ['./login.component.css'],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit{

  //NOTE THIS WILL NOT BE LIKE THIS WHEN WE HAVE A BACKEND
  private users: IUser[];
  private user: IUser;

  private username: string = "test@test.com"; //Use test@test.com
  private password: string = "test"; //temp so we don't have to type it each time
  private rememberMe: boolean = true;

  constructor(private _apiService: ApiService, private _storage: StorageService, private _router: Router, private _userService: UserService) {}

  ngOnInit(){
    //Check to see if we have the user name saved (via the remember me toggle)
    let usrName = this._storage.getFromLocal('savedUsername');

    if(usrName)
      this.username = usrName;

    let s: Subscription;
    s = this._apiService.getAllEntities<IUser>('user.json').subscribe(
      users => this.users = users,
      err => console.log("Could not load users"),
      () => s.unsubscribe()
    );
  }
  
  ngAfterViewInit(){
     window.componentHandler.upgradeAllRegistered();
  }

  //If we login validate the usrname/pass and update our storage
  private loginClicked(): void{
    let u: IUser;
    for(let i=0; i < this.users.length; i++){
      u = this.users[i];

      if(u.email === this.username && u.password === this.password){
        this.user = u;

        this._storage.setValue('user', this.user);
        this._storage.setValue('loggedIn', true);

        if(this.rememberMe)
          this._storage.saveToLocal('savedUsername', this.username);
        else
          this._storage.removeFromLocal('savedUsername');

        this._userService.logIn();
        this._router.navigate(['./home']);
        break;
      }
    }
  }
}