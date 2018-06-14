import { Component, EventEmitter, Input, OnInit, Output, ViewChild, SimpleChanges } from '@angular/core';

import { FileQueueObject, FileUploaderService } from './file-uploader.service';

import { Observable } from 'rxjs/Observable';


@Component({
  selector: 'file-uploader, [file-uploader]',
  templateUrl: 'file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css']
})

export class FileUploaderComponent implements OnInit {
  @ViewChild('fileInput') fileInput;

  @Output() onCompleteItem = new EventEmitter();
  @Output() onRemoveItem = new EventEmitter();
  @Input() files: any;

  public queue: Observable<FileQueueObject[]>;
  public progress = { upload: 0, count: 0, completed: true };

  constructor(public uploader: FileUploaderService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.files) {
      if (!!this.files.length && (!this.progress['count'] || !!this.progress['completed'])) {
        this.uploader.clearQueue();
        this.uploader.addToQueue(this.files);
        this.pieChartProgress();
      }
    }
  }

  ngOnInit() {
    this.queue = this.uploader.queue;
    this.queue.subscribe((res) => {
      this.pieChartProgress();
      const length = res.filter((data) => {
        this.progress['completed'] = !data.inProgress();
        return !data.isPending();
      }).length;
      this.progress['count'] = length;
      this.progress['upload'] = length
        ? Math.round(res.reduce((sum, val) => sum + val['progress'], 0) / length)
        : 0;
    });
    this.uploader.onCompleteItem = this.completeItem;
  }

  completeItem = (item: FileQueueObject, response: any) => {
    this.progress['completed'] = true;
    this.onCompleteItem.emit({ item, response });
  }

  addToQueue() {
    const fileBrowser = this.fileInput.nativeElement;
  }

  removeItem(item) {
    this.onRemoveItem.emit({ item });
    item.remove();
  }

  getFileSize(size) {
    return Math.round(size / Math.pow(2, 30))
      ? Math.round(size / Math.pow(2, 30)) + 'GB'
      : Math.round(size / Math.pow(2, 20))
        ? Math.round(size / Math.pow(2, 20)) + 'MB'
        : Math.round(size / Math.pow(2, 10))
          ? Math.round(size / 1024) + 'KB'
          : '';
  }

  pieChartProgress() {
    Array.from(document.querySelectorAll('.file_progress'))
      .forEach((el) => {
        if (!el) {
          return;
        }
        const percent = el.getAttribute('data-percent');
        const options: any = {
          percent: +percent ? percent : 1 / 1000,
          size: el.getAttribute('data-size') || 20,
          lineWidth: el.getAttribute('data-line') || 10,
          rotate: el.getAttribute('data-rotate') || 0
        }
        const canvas = document.createElement('canvas');
        const span = document.createElement('span');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.height = options.size;
        el.innerHTML = '';
        el.appendChild(canvas);
        ctx.translate(options.size / 2, options.size / 2); // change center
        ctx.rotate((-1 / 2 + options.rotate / 180) * Math.PI); // rotate -90 deg
        const radius = (options.size - options.lineWidth) / 2;
        const drawCircle = function (color, lineWidth, percent) {
          percent = Math.min(Math.max(0, percent || 1), 1);
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2 * percent, false);
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth
          ctx.stroke();
        };
        drawCircle('#efefef', options.lineWidth, 100 / 100);
        drawCircle('#004E70', options.lineWidth, options.percent / 100);
      });
  }
}