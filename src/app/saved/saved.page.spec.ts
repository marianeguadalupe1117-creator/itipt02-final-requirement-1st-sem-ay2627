import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-saved',
  templateUrl: './saved.page.html',
  styleUrls: ['./saved.page.scss'],
  imports: [RouterLink, IonContent, IonHeader, IonTitle, IonToolbar, FormsModule],
})
export class SavedPage {
  constructor() {}}
