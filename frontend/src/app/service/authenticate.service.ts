import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Login } from '../model/login';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthenticateService {

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) { }

  tryLogin(login: Login): Observable<Login>{
    return this.http.post<Login>(environment.apiURL+"login", login, this.httpOptions).pipe(
      tap((newlogin: Login) => console.log(`added login w/ id=${newlogin.username}`)),
      catchError(this.handleError<Login>('tryLogin'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // log to console instead
      return of(result as T);
    };
  }
}
