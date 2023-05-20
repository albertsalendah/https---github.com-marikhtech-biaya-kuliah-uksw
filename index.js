const express = require('express');
const app = express();
const http = require('http');
const port = 8080;
const server = http.createServer(app);
const { db } = require('./db_connection');
const cors = require('cors'); // Import the cors package (perlu di cek ulang untuk flutter)
const corsOptions = {
  origin: 'http://192.168.100.26:8080',
  methods: ['GET', 'POST'],
};
app.use(cors()); //flutter tidak bisa akses API jika tidak menggunakan ini

app.use(express.json());
const bodyParser = require('body-parser');
app.use(bodyParser.json());
    

    app.get('/list_fakultas', (req, res) => {
        try {
          //throw new Error('Simulated Error');
          const sql = `SELECT * FROM list_fakultas`;
          db.query(sql, (err, data) => {
            if (err) throw err;
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });

      app.post('/selectedFakultas', (req, res) => {
        try {
          //throw new Error('Simulated Error');
          const selectedfakultas = req.body;
          const sql = `SELECT * FROM list_progdi WHERE fakultas = '${selectedfakultas.fakultas}'`;
          db.query(sql, (err, data) => {
            if (err) throw err;
            res.send(JSON.stringify(data));
        });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });

      app.post('/selectedProgdi', (req, res) => {
        try {
          //throw new Error('Simulated Error');
          const selectedProgdi = req.body;
          const sql = `SELECT * FROM list_progdi WHERE nama_progdi = '${selectedProgdi.progdi}'`;
          db.query(sql, (err, dataProgdi) => {
            if (err) throw err;
            let id_progdi = 0;
            let nama_progdi = '';
            let fakultas = '';
            let pembangunan = 0;
            let sks = 0;
            let bpp = 0;
            let registrasi_ulang = 0;
            let internasional = 0;
            if(dataProgdi.length > 0){
              id_progdi = dataProgdi[0].id_progdi;
              nama_progdi = dataProgdi[0].nama_progdi;
              fakultas = dataProgdi[0].fakultas;
              pembangunan = dataProgdi[0].pembangunan;
              sks = dataProgdi[0].sks;
              bpp = dataProgdi[0].bpp;
              registrasi_ulang = dataProgdi[0].registrasi_ulang;
              internasional = dataProgdi[0].internasional;
            }
          
            let persen_pembangunan = 0;
            let sks_awal = 0;
            let uang_pangkal = 0;
            let layanan_kemahasiswaan = 0;
            const sqlRegisUlng = `SELECT * FROM param_registrasi_ulang`;
            db.query(sqlRegisUlng, (err, dataParamRegisUlang) => {
              if(dataParamRegisUlang.length > 0){
                persen_pembangunan = dataParamRegisUlang[0].persen_pembangunan;
                sks_awal = dataParamRegisUlang[0].sks_awal;
                uang_pangkal = dataParamRegisUlang[0].uang_pangkal;
                layanan_kemahasiswaan = dataParamRegisUlang[0].layanan_kemahasiswaan;
              }
              const sqlbiayaTambahan = `SELECT * FROM biaya_kuliah_tambahan WHERE nama_progdi = '${selectedProgdi.progdi}'`;
              db.query(sqlbiayaTambahan, (err, databiayaTambahan) => {
                const sqlprogdiInter = `SELECT * FROM biaya_progdi_inter WHERE nama_progdi = '${selectedProgdi.progdi}'`;
                db.query(sqlprogdiInter, (err, dataProgdiInter) => {
                let ganjil = 0;
                let antara = 0;
                let genap = 0;
                if(dataProgdiInter.length > 0){
                  ganjil = dataProgdiInter[0].ganjil;
                  antara = dataProgdiInter[0].antara;
                  genap = dataProgdiInter[0].genap;
                }
                let biaya_pembangunan_awal = pembangunan * (persen_pembangunan/100);
                let biaya_sks_awal = sks_awal * sks;
                let total_registrasi_ulang = biaya_pembangunan_awal + biaya_sks_awal + bpp + uang_pangkal + layanan_kemahasiswaan;
                let total_bpp_pertahun = 0;
                let total_sks_pertahun = selectedProgdi.sksTotal * sks;
                let progInt = [];
                if(internasional != 0){
                  total_bpp_pertahun = ganjil+antara+genap;
                  progInt = dataProgdiInter[0];
                }else{
                  total_bpp_pertahun = bpp * 3;
                  progInt = [];
                }
                let total_biaya_kuliah_perTahun = total_bpp_pertahun+total_sks_pertahun;
                let total_biaya_tambahan = 0;
              
                if(databiayaTambahan.length > 0){
                  for(let i = 0; i< databiayaTambahan.length;i++){
                    if(databiayaTambahan[i].format_pembayaran == "tahun"){
                      total_biaya_tambahan = databiayaTambahan[i].biaya * selectedProgdi.masa_studi;
                    }else if(databiayaTambahan[i].format_pembayaran == "semester"){
                      total_biaya_tambahan = (databiayaTambahan[i].biaya * 3) * selectedProgdi.masa_studi;
                    }else{
                      total_biaya_tambahan += databiayaTambahan[i].biaya;
                    };
                  };
                }
                let total_biaya_hingga_selesai = pembangunan + (total_biaya_kuliah_perTahun * selectedProgdi.masa_studi) + total_biaya_tambahan;
                  const response = {
                      selected: dataProgdi[0],
                      param_registrasi_ulang: dataParamRegisUlang[0],
                      biaya_kuliah_tambahan: databiayaTambahan,
                      dataProgdiInter : progInt,
                      biaya_pembangunan_awal : biaya_pembangunan_awal,
                      biaya_sks_awal : biaya_sks_awal,
                    
                      total_registrasi_ulang : total_registrasi_ulang,
                      total_sks_pertahun : total_sks_pertahun,
                      total_bpp_pertahun : total_bpp_pertahun,
                      total_biaya_kuliah_perTahun : total_biaya_kuliah_perTahun,
                      total_biaya_tambahan : total_biaya_tambahan,
                      total_biaya_hingga_selesai : total_biaya_hingga_selesai
                    };
                    //console.log(total_bpp_pertahun);
                    //console.log(total_sks_pertahun);
                    //console.log(total_biaya_hingga_selesai);
                    res.send(JSON.stringify(response));
                  });
              }); 
          });
        });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });

      app.get('/kategori_biaya_hidup', (req, res) => {
        try {
          //throw new Error('Simulated Error');
          const sql = `SELECT * FROM kategori_biaya_hidup`;
          const sqlFormat = `SELECT * FROM tb_formats`;
          db.query(sql, (err, data) => {
            if (err) throw err;
            db.query(sqlFormat, (errProg, dataFormat) => {
              if (errProg) throw errProg;
              const response = {
                kategori: data,
                formats: dataFormat,
              };
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify(response));
            });
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });

      app.get('/biaya_hidup', (req, res) => {
        try {
          //throw new Error('Simulated Error');
          const sql = `SELECT * FROM biaya_hidup`;
          db.query(sql, (err, data) => {
            if (err) throw err;
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });

    server.listen(port, function() {
    console.log('App running on *: ' + port);
  });