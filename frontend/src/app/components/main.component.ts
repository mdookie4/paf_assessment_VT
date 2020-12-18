import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {CameraService} from '../camera.service';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { AuthenticateService } from '../service/authenticate.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharebackendService } from '../service/sharebackend.service';
import { CameraImage } from '../models';
import { PostData } from '../model/data';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  @ViewChild('imageFile') imageFile: ElementRef;

  imagePath = '/assets/cactus.png'

  mainForm = new FormGroup({
    title: new FormControl("", Validators.required),
    comments: new FormControl("", Validators.required)
  })

  constructor(private cameraSvc: CameraService, private shareBKSvc: SharebackendService,
    private sanitizer: DomSanitizer) { }

	ngOnInit(): void {
	  if (this.cameraSvc.hasImage()) {
		  const img = this.cameraSvc.getImage()
		  this.imagePath = img.imageAsDataUrl
	  }
	}

	clear() {
		this.imagePath = '/assets/cactus.png'
  }

  blobToFile = (theBlob: Blob, fileName:string): File => {
    var b: any = theBlob;
    b.lastModifiedDate = new Date();
    b.name = fileName;
    return <File>theBlob;
  }

  sendBackend() {
    //var imageFile = this.blobToFile(this.cameraSvc.getImage().imageData, "image-"+new Date());
    //console.log(imageFile);
    const formData:FormData = new FormData();
    formData.set('title', this.mainForm.get("title").value);
    formData.set('comments', this.mainForm.get("comments").value);
    //formData.set('path',this.imagePath);
    formData.set('image', this.cameraSvc.getImage().imageData);//imageFile);
    // let title=  this.mainForm.get("title").value;
    // let comments= this.mainForm.get("comments").value;
    // let path = this.imagePath;
    //console.log(formData.getAll);

    this.shareBKSvc.postBackend(formData);
      // .subscribe(result => {
      //   console.log(result);
      // })

  }
}
