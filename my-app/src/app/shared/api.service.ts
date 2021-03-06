/*
    This service is used to consume the backend, it will be changed once we have one working
    Note:
        All of the methods below will be changed to work with the backend API => you shouldn't worry about them yet
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { ICharacter_Class } from '../interfaces/Character_Class';
import { ICharacter } from '../interfaces/Character';
import { ICharacter_History } from '../interfaces/Character_History';
import { ILogin} from '../interfaces/login';
import { IToken} from '../interfaces/token';
import { IUser } from '../user/user';

import { StorageService } from '../shared/session-storage.service';

import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

@Injectable()
export class ApiService {
    private _api = 'https://rogueapi.keisenb.io/api/';
    
    constructor(private _http: HttpClient, private _storage: StorageService) { }

    //NOTE: for all post/puts you will need to include the header {headers: new HttpHeaders().set('Content-Type', 'application/json')}
    getLoginToken(cred: string): Observable<IToken>{
        let headers: HttpHeaders = new HttpHeaders(
            {'Content-Type': 'application/json'}
        );
        return this._http.post(this._api + 'login', cred, {headers}) as Observable<IToken>; //URL, body, Header
    }

    validateToken(): Observable<IUser>{
        let headers: HttpHeaders = new HttpHeaders(
            {"Authorization": "Bearer " + this._storage.getValue("token")}
        );
        return this._http.get(this._api + "user", {headers}) as Observable<IUser>;
    }

    //This will be our main method called once the backend is complete
    getAllEntities<T>(path: string): Observable<T[]>{
        let headers: HttpHeaders = new HttpHeaders(
            {"Authorization": "Bearer " + this._storage.getValue("token")}
        );
        return this._http.get(this._api + path, {headers}) as Observable<T[]>;
    }

    getSingleEntity<T>(path: string, id: number): Observable<T>{
        let headers: HttpHeaders = new HttpHeaders(
            {"Authorization": "Bearer " + this._storage.getValue("token")}
        );
        return this._http.get(this._api + path + "/" + id, {headers}) as Observable<T>;
    }

    putEntity<T>(path: string, obj: string): Observable<T>{
        let headers: HttpHeaders = new HttpHeaders(
            {"Authorization": "Bearer " + this._storage.getValue("token")}
        );
        //let body = JSON.stringify(obj);
        console.log("Sending: " + obj);
        return this._http.put(this._api + path, obj, {headers}) as Observable<T>;
    }

    postEntity<T>(path: string, obj: any): Observable<T>{
        let headers: HttpHeaders = new HttpHeaders(
            {"Authorization": "Bearer " + this._storage.getValue("token")}
        );
        console.log("Sending", obj);
        return this._http.post(this._api + path, obj, {headers}) as Observable<T>;
    }

    deleteEntity<T>(path: string, id: any){
        console.log("Sending:", id);
        let headers: HttpHeaders = new HttpHeaders(
            {"Authorization": "Bearer " + this._storage.getValue("token")}
        );
        return this._http.request('delete', this._api + path, {body: id, headers: headers}) as Observable<T>;
        //return this._http.delete(this._api + path, {headers}) as Observable<T>;
    }
}