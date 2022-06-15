const axios = require('axios');
const { parse } = require('node-html-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');

(
  async () => {
    const url = process.argv[2];
    const file = process.argv[3];

    const data = await axios.get(url).then(r => r.data);
    const body = parse(data);

    const slides = body.querySelectorAll('.slide')
      .map(it => it.innerHTML.match(/srcset="(.*?)"/)[1])
      .map(it => it.split(',').map(it => it.split(' ')).find(it => it[2] === '1024w')[1]);

    const doc = new PDFDocument({ margin: 0, layout: 'landscape' });
    doc.pipe(fs.createWriteStream(file));

    for (let index in slides) {
      const src = slides[index];

      try {
        const img = await axios.get(src, { responseType: 'arraybuffer' }).then(r => r.data);
        doc.image(Buffer.from(img, 'binary'), 0, 0, {
          fit: [doc.page.width, doc.page.height],
          align: 'center',
          valign: 'center'
        });

        if (index < slides.length) {
          doc.addPage();
        }
      } catch (e) {
        console.log(e);
        break;
      }
    }

    doc.end();
  }
)();
