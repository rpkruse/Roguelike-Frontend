/*
  The stats component allows the user to see his past and current characters
  clicking on the characters brings up their stats and if it is a past character
  it will show what they were killed by
*/
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../shared/api.service';
import { StorageService } from '../shared/session-storage.service';
import { ICharacter_Class } from '../interfaces/Character_Class';
import { ICharacter } from '../interfaces/Character';
import { ICharacter_History } from '../interfaces/Character_History';
import { IUser } from '../user/User';

import { SortingCharacterPipe } from '../shared/SortingCharacterPipe'
import { UserService } from '../user/user.service';
import { Subscription } from "rxjs";

import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

declare var window: any;

@Component({
  selector: 'stats',
  styleUrls: ['./stats.component.css'],
  templateUrl: './stats.component.html'
})
export class StatsComponent implements OnInit{
  private character_history: ICharacter_History[] = [];
  private characters: ICharacter[] = [];

  private user: IUser;
  private selectedCharacter: ICharacter_History;

  private characterClasses: ICharacter_Class[] = [];

  private deleteClicked: boolean = false;
  private deleteCharacterString: string = "";

  constructor(private _userService: UserService, private _apiService: ApiService, private _storage: StorageService){}
  
  ngOnInit(){
    //All below this will be removed with backend
    let ch = this._apiService.getAllEntities<ICharacter_History>('character_history.json');
    let char = this._apiService.getAllEntities<ICharacter>('character.json');
    let cc = this._apiService.getAllEntities<ICharacter_Class>('character_class.json');

    Observable.forkJoin([ch, char, cc]).subscribe(results => {
      //results[0] --> ICharacter_History[]
      //results[1] --> ICharacter[]
      //results[2] --> ICharacterClass[]

      let filterByUserID = results[0].filter(x => x.user_id === this._userService.getID());

      for(let i=0; i<filterByUserID.length; i++){
        filterByUserID[i].character = results[1].find(x => x.id === filterByUserID[i].character_id);
      }

      this.character_history = filterByUserID;
      this.user = this._userService.getUser();
      this.characterClasses = results[2];
    });
  }

  ngAfterViewInit(){
    window.componentHandler.upgradeAllRegistered();
  }

  /*
    Returns all of the user's currently alive characters
  */
  private getAliveCharacters(): ICharacter_History[]{
    let ch: ICharacter_History;
    let toReturn: ICharacter_History[] = [];

    for(let i=0; i<this.character_history.length; i++){
      ch = this.character_history[i];  
      if(ch.character.killed_by === null){
        toReturn.push(ch);
      }
    }

    return toReturn;
  }

  /*
    Returns all of the user's dead characters
  */
  private getDeadCharacters(): ICharacter_History[]{
    let ch: ICharacter_History;
    let toReturn: ICharacter_History[] = [];

    for(let i=0; i<this.character_history.length; i++){
      ch = this.character_history[i];  
      if(ch.character.killed_by !== null){
        toReturn.push(ch);
      }
    }

    return toReturn;
  }

  /*
    If we have a dead character, we get what they were killed by
  */
  private getKilledByClass(id: number): ICharacter_Class{
    for(let i=0; i<this.characterClasses.length; i++){
      if(this.characterClasses[i].id === id){
        return this.characterClasses[i];
      }
    }

    return null;
  }

  //When we click a character assign our value to it
  private characterClicked(ch: ICharacter_History){
    this.selectedCharacter = ch;
  }

  /*
    Once we have a backend, we will call our api service to delete the character
  */
  private deleteCharacterClicked(){
    if(this.selectedCharacter.character.name === this.deleteCharacterString){
      //Will delete when we get backend API
      console.log("I CAN DELETE NOW!");
    }
  }



}