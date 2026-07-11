import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Main application shell component declared as standalone.
@Component({
  selector: 'app-root',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
