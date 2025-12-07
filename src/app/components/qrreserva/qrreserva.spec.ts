import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrreservaComponent } from './qrreserva';

describe('Qrreserva', () => {
  let component: QrreservaComponent;
  let fixture: ComponentFixture<QrreservaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrreservaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrreservaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
