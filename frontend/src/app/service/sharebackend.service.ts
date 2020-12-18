import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Login } from '../model/login';
import { PostData } from '../model/data';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SharebackendService {

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) { }

  async postBackend(postData): Promise<any>{ //Observable
    return await this.http.post<any>(environment.apiURL+"backend", postData).toPromise();
    // .pipe(  //), this.httpOptions).pipe(
    //   tap((newPostData: PostData) => console.log(`added postdata w/ id=${newPostData.title}`)),
    //   catchError(this.handleError<PostData>('postBackend'))
    // );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // log to console instead
      return of(result as T);
    };
  }
}
