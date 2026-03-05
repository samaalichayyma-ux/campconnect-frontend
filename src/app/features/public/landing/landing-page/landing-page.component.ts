import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { TestApiService } from '../../../../core/services/test-api.service';

@Component({
  selector: 'app-landing-page',
  imports: [RouterOutlet],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LandingPageComponent  {
  constructor(private testApi: TestApiService) {}

  ngOnInit() {
    this.testApi.testDocs().subscribe({
      next: (res) => console.log('✅ backend OK', res),
      error: (err) => console.log('❌ backend KO', err),
    });
  }

}
