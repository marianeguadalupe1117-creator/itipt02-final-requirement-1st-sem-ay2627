import { Component, input } from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonAvatar,
  IonCard,
  IonCardTitle,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonRow,
  IonText,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline } from 'ionicons/icons';

import type { RecipePost } from './recipe-post';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  imports: [
    IonAccordion,
    IonAccordionGroup,
    IonAvatar,
    IonCard,
    IonCardTitle,
    IonIcon,
    IonImg,
    IonItem,
    IonLabel,
    IonRow,
    IonText,
  ],
})
export class PostCardComponent {
  post = input.required<RecipePost>();
  ownPost = input(false);
  ownPostOnLeft = input(false);
  recipeOpen = input(false);
  imageVersion = input(0);

  constructor() {
    addIcons({ personOutline });
  }
}
