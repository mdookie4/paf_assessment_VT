import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { AuthenticateService } from '../service/authenticate.service';
import { Login } from '../model/login';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage = 'Field cannot be empty'

  loginForm= new FormGroup({
    username: new FormControl("", Validators.required),
    password: new FormControl("", Validators.required)
  })

	constructor(private authSvc: AuthenticateService, private router: Router) { }

  ngOnInit(): void { }

  login() {
    let username = this.loginForm.get("username").value;
    let password = this.loginForm.get("password").value;
    console.log(username + " / " + password);
    this.authSvc.tryLogin({username,password} as Login)
      .subscribe(login => {
        console.log("login result");
        console.log(login);
        this.router.navigate(['/main']);
      })

  }

}
