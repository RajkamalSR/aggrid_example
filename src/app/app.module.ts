import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms"; // <-- NgModel lives here
// HttpClient
import { HttpClientModule } from "@angular/common/http";

// ag-grid
import { AgGridModule } from "ag-grid-angular";
import { AppComponent } from "./app.component";
import { AggridTreeEditor } from "./aggrid-tree-editor.component";
//file upload
import { FileUploaderComponent } from './file-uploader.component';
import { FileUploaderService } from './file-uploader.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule, // <-- import the FormsModule before binding with [(ngModel)]
    HttpClientModule,
    AgGridModule.withComponents([AggridTreeEditor])
  ],
  declarations: [AppComponent, FileUploaderComponent, AggridTreeEditor],
  providers: [FileUploaderService],
  bootstrap: [AppComponent]
})
export class AppModule { }
