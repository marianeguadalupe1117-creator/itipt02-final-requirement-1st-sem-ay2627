
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IonContent,
  IonImg,
  IonList,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonText,
  IonIcon,
  IonButton,
  IonFooter,
  IonToolbar,
  IonHeader,
  IonButtons,
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  homeOutline,
  cartOutline,
  bookmarkOutline,
  calendarOutline,
  chevronBackOutline
} from 'ionicons/icons';

interface RecipeInstructions {
  id: number;
  name: string;
  image: string;
  ingredients: string[];
  instructions: string;
}

@Component({
  selector: 'app-instructions',
  templateUrl: './instructions.page.html',
  styleUrls: ['./instructions.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonImg,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonText,
    IonIcon,
    IonButton,
    IonFooter,
    IonToolbar,
    IonHeader,
    IonButtons,
   
  ]
})
export class InstructionsPage implements OnInit {

  categoryId = signal<number>(0);
  recipeId = signal<number>(0);

  loading = signal<boolean>(false);

  instructions = signal<RecipeInstructions>({
    id: 0,
    name: '',
    image: '',
    ingredients: [],
    instructions: ''
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({
      homeOutline,
      cartOutline,
      bookmarkOutline,
      calendarOutline,
      chevronBackOutline
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {

      const categoryId = Number(params.get('categoryId'));
      const recipeId = Number(params.get('recipeId'));

      this.categoryId.set(
        Number.isInteger(categoryId) && categoryId > 0
          ? categoryId : 0
      );

      this.recipeId.set(
        Number.isInteger(recipeId) && recipeId > 0
          ? recipeId : 0
      );

      this.instructions.set({
        id: 0,
        name: '',
        image: '',
        ingredients: [],
        instructions: ''
      });

      if (this.recipeId() > 0) {
        this.loadInstructions(this.recipeId());
      }

    });
  }

  // FastAPI d2
  loadInstructions(recipeId: number) {
   
  }

  goBack() {
    if (this.categoryId() > 0) {
      this.router.navigate([
        '/recipes',
        this.categoryId()
      ]);
    } else {
      this.router.navigate(['/home']);
    }
  }

}
