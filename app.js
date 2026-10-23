/* =====================================================================
   THE DISAPPEARING PLAYOFF ENFORCER
   NHL playoff fights, 2021-22 through 2025-26.

   Sections
     1. DATA            real data, generated from the project spreadsheets
     2. HELPERS         formatting, tooltip, trading card reveal, shared team filter
     3. VIEWS           one builder per chart (D3)
     4. SCROLL ENGINE   IntersectionObserver that swaps views as steps scroll
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. DATA
   seasons : fights listed by HockeyFights.com vs fights itemized here
   fights  : one record per fight (per = period, sec = seconds elapsed)
   skaters : every skater with 5+ playoff games in the window
             (gp, toi = minutes per game, pim, pts, f = fights, teams)
   enforcers: the four players named in the "mirage" step
   --------------------------------------------------------------------- */
const DATA = {"seasons":[{"s":"2021-22","listed":9,"itemized":9},{"s":"2022-23","listed":13,"itemized":10},{"s":"2023-24","listed":4,"itemized":4},{"s":"2024-25","listed":2,"itemized":2},{"s":"2025-26","listed":4,"itemized":4}],"fights":[{"id":"n265400","s":"2021-22","date":"2022-05-02","per":3,"t":"10:09","sec":609,"p1":"Jan Rutta","t1":"TBL","p2":"Morgan Rielly","t2":"TOR","w":"Morgan Rielly","pct":0.78,"rt":4.46,"v":35,"url":"https://www.hockeyfights.com/fights/n265400","c1":"2021-22_TBL_Jan-Rutta","c2":"2021-22_TOR_Morgan-Rielly"},{"id":"n265403","s":"2021-22","date":"2022-05-03","per":1,"t":"20:00","sec":1200,"p1":"Michael Raffl","t1":"DAL","p2":"Matthew Tkachuk","t2":"CGY","w":"Michael Raffl","pct":0.97,"rt":6.09,"v":68,"url":"https://www.hockeyfights.com/fights/n265403","c1":"2021-22_DAL_Michael-Raffl","c2":"2021-22_CGY_Matthew-Tkachuk"},{"id":"n265404","s":"2021-22","date":"2022-05-03","per":1,"t":"20:00","sec":1200,"p1":"John Klingberg","t1":"DAL","p2":"Rasmus Andersson","t2":"CGY","w":"Rasmus Andersson","pct":0.89,"rt":3.91,"v":34,"url":"https://www.hockeyfights.com/fights/n265404","c1":"2021-22_DAL_John-Klingberg","c2":"2021-22_CGY_Rasmus-Andersson"},{"id":"n265410","s":"2021-22","date":"2022-05-07","per":1,"t":"1:22","sec":82,"p1":"Matthew Tkachuk","t1":"CGY","p2":"John Klingberg","t2":"DAL","w":"Matthew Tkachuk","pct":0.66,"rt":3.09,"v":29,"url":"https://www.hockeyfights.com/fights/n265410","c1":"2021-22_CGY_Matthew-Tkachuk","c2":"2021-22_DAL_John-Klingberg"},{"id":"n265416","s":"2021-22","date":"2022-05-11","per":3,"t":"19:46","sec":1186,"p1":"Anthony Mantha","t1":"WSH","p2":"Aaron Ekblad","t2":"FLA","w":"Anthony Mantha","pct":0.88,"rt":4.09,"v":31,"url":"https://www.hockeyfights.com/fights/n265416","c1":"2021-22_WSH_Anthony-Mantha","c2":"2021-22_FLA_Aaron-Ekblad"},{"id":"n265426","s":"2021-22","date":"2022-05-24","per":1,"t":"11:38","sec":698,"p1":"Steven Lorentz","t1":"CAR","p2":"Jacob Trouba","t2":"NYR","w":"Jacob Trouba","pct":0.87,"rt":4.32,"v":37,"url":"https://www.hockeyfights.com/fights/n265426","c1":"2021-22_CAR_Steven-Lorentz","c2":"2021-22_NYR_Jacob-Trouba"},{"id":"n265432","s":"2021-22","date":"2022-06-07","per":2,"t":"11:23","sec":683,"p1":"Frank Vatrano","t1":"NYR","p2":"Brandon Hagel","t2":"TBL","w":"Brandon Hagel","pct":0.48,"rt":5.33,"v":58,"url":"https://www.hockeyfights.com/fights/n265432","c1":"2021-22_NYR_Frank-Vatrano","c2":"2021-22_TBL_Brandon-Hagel"},{"id":"n265434","s":"2021-22","date":"2022-06-09","per":3,"t":"20:00","sec":1200,"p1":"Steven Stamkos","t1":"TBL","p2":"Alexis Lafrenière","t2":"NYR","w":"Steven Stamkos","pct":0.81,"rt":4.9,"v":44,"url":"https://www.hockeyfights.com/fights/n265434","c1":"2021-22_TBL_Steven-Stamkos","c2":"2021-22_NYR_Alexis-Lafreniere"},{"id":"n265438","s":"2021-22","date":"2022-06-20","per":3,"t":"17:48","sec":1068,"p1":"Logan O'Connor","t1":"COL","p2":"Ross Colton","t2":"TBL","w":"Logan O'Connor","pct":0.62,"rt":6.22,"v":54,"url":"https://www.hockeyfights.com/fights/n265438","c1":"2021-22_COL_Logan-O-Connor","c2":"2021-22_TBL_Ross-Colton"},{"id":"n267508","s":"2022-23","date":"2023-04-20","per":3,"t":"13:20","sec":800,"p1":"Braden Schneider","t1":"NYR","p2":"Michael McLeod","t2":"NJD","w":"Braden Schneider","pct":0.66,"rt":6.47,"v":78,"url":"https://www.hockeyfights.com/fights/n267508","c1":"2022-23_NYR_Braden-Schneider","c2":"2022-23_NJD_Michael-McLeod"},{"id":"n267511","s":"2022-23","date":"2023-04-22","per":3,"t":"5:04","sec":304,"p1":"Ryan O'Reilly","t1":"TOR","p2":"Nikita Kucherov","t2":"TBL","w":"Nikita Kucherov","pct":0.47,"rt":3.69,"v":21,"url":"https://www.hockeyfights.com/fights/n267511","c1":"2022-23_TOR_Ryan-O-Reilly","c2":"2022-23_TBL_Nikita-Kucherov"},{"id":"n267510","s":"2022-23","date":"2023-04-22","per":3,"t":"5:04","sec":304,"p1":"Auston Matthews","t1":"TOR","p2":"Steven Stamkos","t2":"TBL","w":"Steven Stamkos","pct":0.75,"rt":4.02,"v":79,"url":"https://www.hockeyfights.com/fights/n267510","c1":"2022-23_TOR_Auston-Matthews","c2":"2022-23_TBL_Steven-Stamkos"},{"id":"n267509","s":"2022-23","date":"2023-04-22","per":1,"t":"0:49","sec":49,"p1":"Keegan Kolesar","t1":"VGK","p2":"Brenden Dillon","t2":"WPG","w":"Brenden Dillon","pct":0.57,"rt":5.7,"v":31,"url":"https://www.hockeyfights.com/fights/n267509","c1":"2022-23_VGK_Keegan-Kolesar","c2":"2022-23_WPG_Brenden-Dillon"},{"id":"n267512","s":"2022-23","date":"2023-04-23","per":3,"t":"16:49","sec":1009,"p1":"Derek Forbort","t1":"BOS","p2":"Brandon Montour","t2":"FLA","w":"Derek Forbort","pct":0.38,"rt":3.05,"v":22,"url":"https://www.hockeyfights.com/fights/n267512","c1":"2022-23_BOS_Derek-Forbort","c2":"2022-23_FLA_Brandon-Montour"},{"id":"n267513","s":"2022-23","date":"2023-04-27","per":2,"t":"12:04","sec":724,"p1":"Barclay Goodrow","t1":"NYR","p2":"Kevin Bahl","t2":"NJD","w":"Kevin Bahl","pct":0.44,"rt":4.02,"v":34,"url":"https://www.hockeyfights.com/fights/n267513","c1":"2022-23_NYR_Barclay-Goodrow","c2":"2022-23_NJD_Kevin-Bahl"},{"id":"n267523","s":"2022-23","date":"2023-05-06","per":3,"t":"19:36","sec":1176,"p1":"Klim Kostin","t1":"EDM","p2":"Zach Whitecloud","t2":"VGK","w":"Klim Kostin","pct":0.59,"rt":3.09,"v":15,"url":"https://www.hockeyfights.com/fights/n267523","c1":"2022-23_EDM_Klim-Kostin","c2":"2022-23_VGK_Zach-Whitecloud"},{"id":"n267522","s":"2022-23","date":"2023-05-06","per":3,"t":"17:42","sec":1062,"p1":"Brett Kulak","t1":"EDM","p2":"Brett Howden","t2":"VGK","w":"Brett Kulak","pct":0.31,"rt":2.38,"v":13,"url":"https://www.hockeyfights.com/fights/n267522","c1":"2022-23_EDM_Brett-Kulak","c2":"2022-23_VGK_Brett-Howden"},{"id":"n267524","s":"2022-23","date":"2023-05-07","per":3,"t":"7:13","sec":433,"p1":"Stefan Noesen","t1":"CAR","p2":"Erik Haula","t2":"NJD","w":"Stefan Noesen","pct":0.85,"rt":5.08,"v":57,"url":"https://www.hockeyfights.com/fights/n267524","c1":"2022-23_CAR_Stefan-Noesen","c2":"2022-23_NJD_Erik-Haula"},{"id":"n267560","s":"2022-23","date":"2023-05-10","per":3,"t":"19:10","sec":1150,"p1":"Nicolas Hague","t1":"VGK","p2":"Darnell Nurse","t2":"EDM","w":"Nicolas Hague","pct":0.45,"rt":7.36,"v":126,"url":"https://www.hockeyfights.com/fights/n267560","c1":"2022-23_VGK_Nicolas-Hague","c2":"2022-23_EDM_Darnell-Nurse"},{"id":"n269559","s":"2023-24","date":"2024-04-22","per":1,"t":"13:23","sec":803,"p1":"Kyle MacLean","t1":"NYI","p2":"Stefan Noesen","t2":"CAR","w":"Stefan Noesen","pct":0.62,"rt":5.15,"v":26,"url":"https://www.hockeyfights.com/fights/n269559","c1":"2023-24_NYI_Kyle-MacLean","c2":"2023-24_CAR_Stefan-Noesen"},{"id":"n269561","s":"2023-24","date":"2024-04-26","per":3,"t":"5:19","sec":319,"p1":"Evander Kane","t1":"EDM","p2":"Andreas Englund","t2":"LAK","w":"Evander Kane","pct":0.76,"rt":4.24,"v":35,"url":"https://www.hockeyfights.com/fights/n269561","c1":"2023-24_EDM_Evander-Kane","c2":"2023-24_LAK_Andreas-Englund"},{"id":"n269570","s":"2023-24","date":"2024-04-26","per":3,"t":"19:33","sec":1173,"p1":"Adam Lowry","t1":"WPG","p2":"Miles Wood","t2":"COL","w":"Adam Lowry","pct":0.33,"rt":1.92,"v":5,"url":"https://www.hockeyfights.com/fights/n269570","c1":"2023-24_WPG_Adam-Lowry","c2":"2023-24_COL_Miles-Wood"},{"id":"n269572","s":"2023-24","date":"2024-05-08","per":3,"t":"12:42","sec":762,"p1":"David Pastrnak","t1":"BOS","p2":"Matthew Tkachuk","t2":"FLA","w":"Matthew Tkachuk","pct":0.78,"rt":4.97,"v":59,"url":"https://www.hockeyfights.com/fights/n269572","c1":"2023-24_BOS_David-Pastrnak","c2":"2023-24_FLA_Matthew-Tkachuk"},{"id":"n271733","s":"2024-25","date":"2025-05-12","per":1,"t":"4:36","sec":276,"p1":"Nicolas Hague","t1":"VGK","p2":"Trent Frederic","t2":"EDM","w":"Nicolas Hague","pct":0.72,"rt":6.8,"v":70,"url":"https://www.hockeyfights.com/fights/n271733","c1":"2024-25_VGK_Nicolas-Hague","c2":"2024-25_EDM_Trent-Frederic"},{"id":"n271744","s":"2024-25","date":"2025-06-09","per":3,"t":"10:29","sec":629,"p1":"Darnell Nurse","t1":"EDM","p2":"Jonah Gadjovich","t2":"FLA","w":"Jonah Gadjovich","pct":0.77,"rt":6.73,"v":71,"url":"https://www.hockeyfights.com/fights/n271744","c1":"2024-25_EDM_Darnell-Nurse","c2":"2024-25_FLA_Jonah-Gadjovich"},{"id":"n273544","s":"2025-26","date":"2026-04-18","per":1,"t":"0:03","sec":3,"p1":"Brady Tkachuk","t1":"OTT","p2":"Jordan Staal","t2":"CAR","w":"Jordan Staal","pct":0.75,"rt":5.36,"v":104,"url":"https://www.hockeyfights.com/fights/n273544","c1":"2025-26_OTT_Brady-Tkachuk","c2":"2025-26_CAR_Jordan-Staal"},{"id":"n273551","s":"2025-26","date":"2026-04-21","per":3,"t":"2:26","sec":146,"p1":"Mark Kastelic","t1":"BOS","p2":"Logan Stanley","t2":"BUF","w":"Mark Kastelic","pct":0.44,"rt":4.32,"v":62,"url":"https://www.hockeyfights.com/fights/n273551","c1":"2025-26_BOS_Mark-Kastelic","c2":"2025-26_BUF_Logan-Stanley"},{"id":"n273550","s":"2025-26","date":"2026-04-21","per":2,"t":"5:14","sec":314,"p1":"Juraj Slafkovský","t1":"MTL","p2":"Brandon Hagel","t2":"TBL","w":"Brandon Hagel","pct":0.89,"rt":6.03,"v":95,"url":"https://www.hockeyfights.com/fights/n273550","c1":"2025-26_MTL_Juraj-Slafkovsky","c2":"2025-26_TBL_Brandon-Hagel"},{"id":"n273553","s":"2025-26","date":"2026-04-24","per":3,"t":"19:35","sec":1175,"p1":"Vasily Podkolzin","t1":"EDM","p2":"Jeff Viel","t2":"ANA","w":"Vasily Podkolzin","pct":0.61,"rt":4.0,"v":36,"url":"https://www.hockeyfights.com/fights/n273553","c1":"2025-26_EDM_Vasily-Podkolzin","c2":"2025-26_ANA_Jeff-Viel"}],"skaters":[{"n":"Aaron Ekblad","pos":"D","gp":73,"toi":23.48,"pim":85,"pts":32,"f":1,"teams":["FLA"]},{"n":"Adam Fox","pos":"D","gp":43,"toi":25.07,"pim":26,"pts":39,"f":0,"teams":[]},{"n":"Adam Gaudette","pos":"R","gp":6,"toi":9.28,"pim":4,"pts":3,"f":0,"teams":[]},{"n":"Adam Henrique","pos":"C","gp":40,"toi":14.15,"pim":6,"pts":14,"f":0,"teams":[]},{"n":"Adam Larsson","pos":"D","gp":14,"toi":25.18,"pim":8,"pts":4,"f":0,"teams":[]},{"n":"Adam Lowry","pos":"C","gp":23,"toi":16.92,"pim":25,"pts":11,"f":1,"teams":["WPG"]},{"n":"Adam Pelech","pos":"D","gp":11,"toi":23.12,"pim":6,"pts":4,"f":0,"teams":[]},{"n":"Adrian Kempe","pos":"R","gp":28,"toi":20.53,"pim":14,"pts":31,"f":0,"teams":[]},{"n":"Alec Martinez","pos":"D","gp":28,"toi":18.92,"pim":4,"pts":7,"f":0,"teams":[]},{"n":"Aleksander Barkov","pos":"C","gp":78,"toi":21.32,"pim":26,"pts":67,"f":0,"teams":[]},{"n":"Alex Bump","pos":"L","gp":6,"toi":13.93,"pim":0,"pts":2,"f":0,"teams":[]},{"n":"Alex Iafallo","pos":"L","gp":31,"toi":16.12,"pim":20,"pts":11,"f":0,"teams":[]},{"n":"Alex Killorn","pos":"L","gp":41,"toi":19.23,"pim":20,"pts":18,"f":0,"teams":[]},{"n":"Alex Laferriere","pos":"R","gp":15,"toi":17.67,"pim":2,"pts":9,"f":0,"teams":[]},{"n":"Alex Newhook","pos":"C","gp":43,"toi":13.92,"pim":28,"pts":17,"f":0,"teams":[]},{"n":"Alex Ovechkin","pos":"L","gp":20,"toi":18.0,"pim":6,"pts":12,"f":0,"teams":[]},{"n":"Alex Pietrangelo","pos":"D","gp":38,"toi":23.3,"pim":33,"pts":17,"f":0,"teams":[]},{"n":"Alex Tuch","pos":"R","gp":13,"toi":20.55,"pim":8,"pts":7,"f":0,"teams":[]},{"n":"Alexander Alexeyev","pos":"D","gp":14,"toi":12.93,"pim":8,"pts":1,"f":0,"teams":[]},{"n":"Alexander Edler","pos":"D","gp":11,"toi":15.92,"pim":18,"pts":2,"f":0,"teams":[]},{"n":"Alexander Kerfoot","pos":"C","gp":24,"toi":15.27,"pim":14,"pts":5,"f":0,"teams":[]},{"n":"Alexander Nikishin","pos":"D","gp":21,"toi":15.05,"pim":8,"pts":2,"f":0,"teams":[]},{"n":"Alexander Petrovic","pos":"D","gp":25,"toi":12.52,"pim":6,"pts":2,"f":0,"teams":[]},{"n":"Alexander Romanov","pos":"D","gp":9,"toi":20.45,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Alexander Wennberg","pos":"C","gp":30,"toi":17.77,"pim":6,"pts":9,"f":0,"teams":[]},{"n":"Alexandre Carrier","pos":"D","gp":34,"toi":21.58,"pim":28,"pts":15,"f":0,"teams":[]},{"n":"Alexandre Texier","pos":"L","gp":22,"toi":12.75,"pim":4,"pts":9,"f":0,"teams":[]},{"n":"Alexey Toropchenko","pos":"R","gp":19,"toi":10.77,"pim":12,"pts":6,"f":0,"teams":[]},{"n":"Alexis Lafrenière","pos":"L","gp":43,"toi":15.07,"pim":17,"pts":23,"f":1,"teams":["NYR"]},{"n":"Aliaksei Protas","pos":"L","gp":10,"toi":16.55,"pim":0,"pts":4,"f":0,"teams":[]},{"n":"Anders Lee","pos":"L","gp":11,"toi":16.68,"pim":18,"pts":5,"f":0,"teams":[]},{"n":"Andre Burakovsky","pos":"L","gp":12,"toi":12.42,"pim":2,"pts":8,"f":0,"teams":[]},{"n":"Andreas Athanasiou","pos":"C","gp":6,"toi":14.35,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Andreas Englund","pos":"D","gp":5,"toi":13.08,"pim":9,"pts":1,"f":1,"teams":["LAK"]},{"n":"Andrei Kuzmenko","pos":"L","gp":7,"toi":17.15,"pim":4,"pts":6,"f":0,"teams":[]},{"n":"Andrei Svechnikov","pos":"R","gp":59,"toi":17.65,"pim":76,"pts":39,"f":0,"teams":[]},{"n":"Andrew Cogliano","pos":"C","gp":31,"toi":9.3,"pim":18,"pts":11,"f":0,"teams":[]},{"n":"Andrew Copp","pos":"C","gp":20,"toi":19.82,"pim":2,"pts":14,"f":0,"teams":[]},{"n":"Andrew Mangiapane","pos":"L","gp":22,"toi":13.6,"pim":24,"pts":8,"f":0,"teams":[]},{"n":"Andrew Peeke","pos":"D","gp":12,"toi":17.25,"pim":16,"pts":1,"f":0,"teams":[]},{"n":"Anthony Beauvillier","pos":"R","gp":16,"toi":13.03,"pim":4,"pts":8,"f":0,"teams":[]},{"n":"Anthony Cirelli","pos":"C","gp":46,"toi":18.75,"pim":32,"pts":19,"f":0,"teams":[]},{"n":"Anthony Duclair","pos":"L","gp":33,"toi":14.4,"pim":20,"pts":16,"f":0,"teams":[]},{"n":"Anthony Mantha","pos":"R","gp":15,"toi":15.05,"pim":35,"pts":5,"f":1,"teams":["WSH"]},{"n":"Anthony-John (AJ) Greer","pos":"L","gp":16,"toi":7.63,"pim":22,"pts":3,"f":0,"teams":[]},{"n":"Anton Lundell","pos":"C","gp":77,"toi":16.15,"pim":30,"pts":46,"f":0,"teams":[]},{"n":"Anze Kopitar","pos":"C","gp":28,"toi":21.23,"pim":6,"pts":23,"f":0,"teams":[]},{"n":"Arber Xhekaj","pos":"D","gp":16,"toi":8.63,"pim":32,"pts":2,"f":0,"teams":[]},{"n":"Artem Zub","pos":"D","gp":7,"toi":20.48,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Artemi Panarin","pos":"L","gp":47,"toi":20.42,"pim":14,"pts":36,"f":0,"teams":[]},{"n":"Arthur Kaliyev","pos":"R","gp":9,"toi":11.97,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Artturi Lehkonen","pos":"L","gp":56,"toi":18.85,"pim":36,"pts":41,"f":0,"teams":[]},{"n":"Auston Matthews","pos":"C","gp":36,"toi":21.55,"pim":11,"pts":35,"f":1,"teams":["TOR"]},{"n":"Barclay Goodrow","pos":"C","gp":32,"toi":13.5,"pim":47,"pts":10,"f":1,"teams":["NYR"]},{"n":"Beck Malenstyn","pos":"L","gp":17,"toi":10.85,"pim":10,"pts":3,"f":0,"teams":[]},{"n":"Beckett Sennecke","pos":"R","gp":12,"toi":16.97,"pim":4,"pts":6,"f":0,"teams":[]},{"n":"Ben Chiarot","pos":"D","gp":10,"toi":17.28,"pim":8,"pts":1,"f":0,"teams":[]},{"n":"Ben Hutton","pos":"D","gp":10,"toi":13.37,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Ben Kindel","pos":"C","gp":6,"toi":13.12,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Ben Meyers","pos":"C","gp":6,"toi":5.5,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Blake Coleman","pos":"L","gp":12,"toi":14.8,"pim":12,"pts":5,"f":0,"teams":[]},{"n":"Blake Lizotte","pos":"C","gp":21,"toi":12.57,"pim":22,"pts":4,"f":0,"teams":[]},{"n":"Blake Wheeler","pos":"R","gp":6,"toi":16.55,"pim":2,"pts":6,"f":0,"teams":[]},{"n":"Bo Horvat","pos":"C","gp":11,"toi":20.82,"pim":0,"pts":5,"f":0,"teams":[]},{"n":"Bobby McMann","pos":"C","gp":13,"toi":12.6,"pim":16,"pts":3,"f":0,"teams":[]},{"n":"Bowen Byram","pos":"D","gp":40,"toi":20.8,"pim":22,"pts":19,"f":0,"teams":[]},{"n":"Brad Marchand","pos":"L","gp":48,"toi":18.12,"pim":76,"pts":51,"f":0,"teams":[]},{"n":"Braden Schneider","pos":"D","gp":43,"toi":14.15,"pim":31,"pts":6,"f":1,"teams":["NYR"]},{"n":"Brady Skjei","pos":"D","gp":40,"toi":22.25,"pim":26,"pts":16,"f":0,"teams":[]},{"n":"Brady Tkachuk","pos":"L","gp":10,"toi":19.58,"pim":19,"pts":7,"f":1,"teams":["OTT"]},{"n":"Brandon Carlo","pos":"D","gp":40,"toi":19.37,"pim":24,"pts":9,"f":0,"teams":[]},{"n":"Brandon Duhaime","pos":"L","gp":33,"toi":10.23,"pim":30,"pts":5,"f":0,"teams":[]},{"n":"Brandon Hagel","pos":"L","gp":44,"toi":17.98,"pim":45,"pts":24,"f":2,"teams":["TBL"]},{"n":"Brandon Montour","pos":"D","gp":55,"toi":23.07,"pim":57,"pts":27,"f":1,"teams":["FLA"]},{"n":"Brandon Saad","pos":"L","gp":25,"toi":14.3,"pim":6,"pts":9,"f":0,"teams":[]},{"n":"Brandon Tanev","pos":"L","gp":33,"toi":11.57,"pim":26,"pts":4,"f":0,"teams":[]},{"n":"Brandt Clarke","pos":"D","gp":10,"toi":15.58,"pim":0,"pts":3,"f":0,"teams":[]},{"n":"Brayden McNabb","pos":"D","gp":60,"toi":20.37,"pim":39,"pts":23,"f":0,"teams":[]},{"n":"Brayden Point","pos":"C","gp":32,"toi":19.88,"pim":14,"pts":17,"f":0,"teams":[]},{"n":"Brayden Schenn","pos":"C","gp":19,"toi":18.12,"pim":44,"pts":11,"f":0,"teams":[]},{"n":"Brendan Gallagher","pos":"R","gp":8,"toi":12.17,"pim":0,"pts":3,"f":0,"teams":[]},{"n":"Brendan Lemieux","pos":"L","gp":7,"toi":8.35,"pim":18,"pts":1,"f":0,"teams":[]},{"n":"Brendan Smith","pos":"D","gp":17,"toi":12.27,"pim":24,"pts":5,"f":0,"teams":[]},{"n":"Brenden Dillon","pos":"D","gp":9,"toi":20.55,"pim":13,"pts":4,"f":1,"teams":["WPG"]},{"n":"Brent Burns","pos":"D","gp":54,"toi":22.6,"pim":38,"pts":22,"f":0,"teams":[]},{"n":"Brett Howden","pos":"C","gp":62,"toi":14.78,"pim":41,"pts":33,"f":1,"teams":["VGK"]},{"n":"Brett Kulak","pos":"D","gp":88,"toi":18.93,"pim":49,"pts":25,"f":1,"teams":["EDM"]},{"n":"Brett Pesce","pos":"D","gp":36,"toi":22.93,"pim":22,"pts":13,"f":0,"teams":[]},{"n":"Brett Ritchie","pos":"R","gp":7,"toi":8.67,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Brian Boyle","pos":"C","gp":6,"toi":10.25,"pim":0,"pts":2,"f":0,"teams":[]},{"n":"Brian Dumoulin","pos":"D","gp":10,"toi":24.92,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Brock Boeser","pos":"R","gp":12,"toi":20.3,"pim":8,"pts":12,"f":0,"teams":[]},{"n":"Brock Faber","pos":"D","gp":23,"toi":25.08,"pim":12,"pts":10,"f":0,"teams":[]},{"n":"Brock McGinn","pos":"L","gp":7,"toi":17.25,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Brock Nelson","pos":"C","gp":31,"toi":18.05,"pim":26,"pts":16,"f":0,"teams":[]},{"n":"Bryan Rust","pos":"R","gp":13,"toi":21.73,"pim":8,"pts":10,"f":0,"teams":[]},{"n":"Cal Clutterbuck","pos":"R","gp":11,"toi":10.83,"pim":26,"pts":1,"f":0,"teams":[]},{"n":"Cal Foote","pos":"D","gp":13,"toi":11.48,"pim":6,"pts":2,"f":0,"teams":[]},{"n":"Cale Makar","pos":"D","gp":55,"toi":26.53,"pim":22,"pts":59,"f":0,"teams":[]},{"n":"Calle Jarnkrok","pos":"C","gp":42,"toi":13.87,"pim":2,"pts":8,"f":0,"teams":[]},{"n":"Calle Rosen","pos":"D","gp":9,"toi":14.47,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Cam Fowler","pos":"D","gp":7,"toi":23.28,"pim":0,"pts":10,"f":0,"teams":[]},{"n":"Cam York","pos":"D","gp":10,"toi":23.37,"pim":6,"pts":2,"f":0,"teams":[]},{"n":"Carl Grundstrom","pos":"R","gp":20,"toi":10.7,"pim":6,"pts":6,"f":0,"teams":[]},{"n":"Carson Soucy","pos":"D","gp":26,"toi":15.68,"pim":18,"pts":7,"f":0,"teams":[]},{"n":"Carter Verhaeghe","pos":"C","gp":78,"toi":19.05,"pim":38,"pts":73,"f":0,"teams":[]},{"n":"Casey Cizikas","pos":"C","gp":11,"toi":15.0,"pim":30,"pts":5,"f":0,"teams":[]},{"n":"Casey Mittelstadt","pos":"C","gp":17,"toi":16.55,"pim":2,"pts":11,"f":0,"teams":[]},{"n":"Chad Ruhwedel","pos":"D","gp":7,"toi":14.93,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Chandler Stephenson","pos":"C","gp":29,"toi":18.2,"pim":38,"pts":21,"f":0,"teams":[]},{"n":"Charlie Coyle","pos":"C","gp":34,"toi":16.87,"pim":20,"pts":14,"f":0,"teams":[]},{"n":"Charlie McAvoy","pos":"D","gp":32,"toi":25.43,"pim":51,"pts":18,"f":0,"teams":[]},{"n":"Chris Kreider","pos":"L","gp":55,"toi":18.47,"pim":20,"pts":44,"f":0,"teams":[]},{"n":"Chris Tanev","pos":"D","gp":40,"toi":20.85,"pim":10,"pts":6,"f":0,"teams":[]},{"n":"Chris Wagner","pos":"R","gp":5,"toi":9.72,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Christian Dvorak","pos":"C","gp":15,"toi":17.52,"pim":12,"pts":6,"f":0,"teams":[]},{"n":"Claude Giroux","pos":"R","gp":20,"toi":18.32,"pim":0,"pts":13,"f":0,"teams":[]},{"n":"Clayton Keller","pos":"R","gp":6,"toi":21.48,"pim":0,"pts":5,"f":0,"teams":[]},{"n":"Cody Ceci","pos":"D","gp":74,"toi":19.88,"pim":16,"pts":16,"f":0,"teams":[]},{"n":"Cody Glass","pos":"C","gp":7,"toi":12.87,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Cole Caufield","pos":"R","gp":24,"toi":18.63,"pim":0,"pts":17,"f":0,"teams":[]},{"n":"Cole Perfetti","pos":"C","gp":14,"toi":15.9,"pim":2,"pts":6,"f":0,"teams":[]},{"n":"Cole Smith","pos":"R","gp":27,"toi":12.08,"pim":24,"pts":6,"f":0,"teams":[]},{"n":"Colin Blackwell","pos":"C","gp":24,"toi":10.13,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Colin Miller","pos":"D","gp":15,"toi":15.92,"pim":8,"pts":4,"f":0,"teams":[]},{"n":"Colin White","pos":"C","gp":21,"toi":7.42,"pim":6,"pts":2,"f":0,"teams":[]},{"n":"Colton Dach","pos":"C","gp":5,"toi":8.45,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Colton Parayko","pos":"D","gp":19,"toi":24.88,"pim":12,"pts":11,"f":0,"teams":[]},{"n":"Colton Sissons","pos":"C","gp":32,"toi":14.7,"pim":12,"pts":11,"f":0,"teams":[]},{"n":"Connor Brown","pos":"R","gp":39,"toi":13.85,"pim":8,"pts":15,"f":0,"teams":[]},{"n":"Connor Clifton","pos":"D","gp":13,"toi":15.33,"pim":10,"pts":2,"f":0,"teams":[]},{"n":"Connor Dewar","pos":"C","gp":19,"toi":12.05,"pim":2,"pts":3,"f":0,"teams":[]},{"n":"Connor McDavid","pos":"C","gp":81,"toi":23.55,"pim":26,"pts":134,"f":0,"teams":[]},{"n":"Connor McMichael","pos":"L","gp":18,"toi":14.4,"pim":4,"pts":8,"f":0,"teams":[]},{"n":"Connor Murphy","pos":"D","gp":6,"toi":21.28,"pim":0,"pts":3,"f":0,"teams":[]},{"n":"Conor Garland","pos":"R","gp":13,"toi":15.08,"pim":2,"pts":5,"f":0,"teams":[]},{"n":"Conor Geekie","pos":"C","gp":6,"toi":10.45,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Conor Sheary","pos":"L","gp":6,"toi":17.07,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Conor Timmins","pos":"D","gp":13,"toi":16.8,"pim":8,"pts":2,"f":0,"teams":[]},{"n":"Corey Perry","pos":"R","gp":77,"toi":12.5,"pim":61,"pts":33,"f":0,"teams":[]},{"n":"Craig Smith","pos":"C","gp":21,"toi":11.43,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Curtis Lazar","pos":"C","gp":18,"toi":9.85,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Cutter Gauthier","pos":"L","gp":12,"toi":16.25,"pim":4,"pts":12,"f":0,"teams":[]},{"n":"Daemon Hunt","pos":"D","gp":5,"toi":13.07,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Dakota Joshua","pos":"C","gp":14,"toi":15.32,"pim":10,"pts":8,"f":0,"teams":[]},{"n":"Damon Severson","pos":"D","gp":12,"toi":18.55,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Daniel Sprong","pos":"R","gp":11,"toi":8.78,"pim":0,"pts":2,"f":0,"teams":[]},{"n":"Danila Yurov","pos":"R","gp":9,"toi":12.12,"pim":8,"pts":3,"f":0,"teams":[]},{"n":"Dante Fabbro","pos":"D","gp":7,"toi":16.98,"pim":4,"pts":0,"f":0,"teams":[]},{"n":"Danton Heinen","pos":"L","gp":15,"toi":15.4,"pim":4,"pts":4,"f":0,"teams":[]},{"n":"Darnell Nurse","pos":"D","gp":79,"toi":21.42,"pim":94,"pts":24,"f":2,"teams":["EDM"]},{"n":"Darren Helm","pos":"C","gp":21,"toi":11.42,"pim":12,"pts":5,"f":0,"teams":[]},{"n":"Darren Raddysh","pos":"D","gp":20,"toi":22.07,"pim":8,"pts":4,"f":0,"teams":[]},{"n":"David Gustafsson","pos":"C","gp":11,"toi":7.85,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"David Kampf","pos":"C","gp":26,"toi":14.73,"pim":10,"pts":6,"f":0,"teams":[]},{"n":"David Pastrnak","pos":"R","gp":33,"toi":20.03,"pim":37,"pts":26,"f":1,"teams":["BOS"]},{"n":"David Perron","pos":"L","gp":18,"toi":17.73,"pim":14,"pts":16,"f":0,"teams":[]},{"n":"David Savard","pos":"D","gp":5,"toi":11.65,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Dawson Mercer","pos":"C","gp":17,"toi":17.93,"pim":10,"pts":9,"f":0,"teams":[]},{"n":"Denis Gurianov","pos":"R","gp":5,"toi":11.33,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Denis Malgin","pos":"C","gp":7,"toi":7.65,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Denver Barkey","pos":"C","gp":10,"toi":13.02,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Derek Forbort","pos":"D","gp":17,"toi":17.07,"pim":31,"pts":2,"f":1,"teams":["BOS"]},{"n":"Derek Ryan","pos":"C","gp":45,"toi":10.22,"pim":12,"pts":7,"f":0,"teams":[]},{"n":"Derek Stepan","pos":"C","gp":14,"toi":11.25,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Devon Toews","pos":"D","gp":57,"toi":25.28,"pim":14,"pts":45,"f":0,"teams":[]},{"n":"Dillon Dube","pos":"C","gp":12,"toi":14.32,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Dmitry Kulikov","pos":"D","gp":49,"toi":15.25,"pim":32,"pts":8,"f":0,"teams":[]},{"n":"Dmitry Orlov","pos":"D","gp":39,"toi":21.78,"pim":28,"pts":19,"f":0,"teams":[]},{"n":"Dominic James","pos":"C","gp":7,"toi":12.1,"pim":0,"pts":3,"f":0,"teams":[]},{"n":"Dougie Hamilton","pos":"D","gp":17,"toi":22.08,"pim":8,"pts":6,"f":0,"teams":[]},{"n":"Drake Batherson","pos":"R","gp":10,"toi":18.98,"pim":14,"pts":6,"f":0,"teams":[]},{"n":"Drew Doughty","pos":"D","gp":21,"toi":27.15,"pim":24,"pts":10,"f":0,"teams":[]},{"n":"Drew Helleson","pos":"D","gp":8,"toi":9.22,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Duncan Keith","pos":"D","gp":16,"toi":19.67,"pim":4,"pts":5,"f":0,"teams":[]},{"n":"Dustin Brown","pos":"R","gp":7,"toi":12.65,"pim":0,"pts":2,"f":0,"teams":[]},{"n":"Dylan Coghlan","pos":"D","gp":13,"toi":14.23,"pim":4,"pts":3,"f":0,"teams":[]},{"n":"Dylan Cozens","pos":"C","gp":10,"toi":17.97,"pim":12,"pts":4,"f":0,"teams":[]},{"n":"Dylan DeMelo","pos":"D","gp":22,"toi":22.67,"pim":18,"pts":7,"f":0,"teams":[]},{"n":"Dylan Guenther","pos":"R","gp":6,"toi":20.78,"pim":2,"pts":5,"f":0,"teams":[]},{"n":"Dylan Holloway","pos":"L","gp":26,"toi":11.2,"pim":8,"pts":7,"f":0,"teams":[]},{"n":"Dylan Samberg","pos":"D","gp":23,"toi":20.42,"pim":10,"pts":3,"f":0,"teams":[]},{"n":"Dylan Strome","pos":"C","gp":14,"toi":18.25,"pim":2,"pts":13,"f":0,"teams":[]},{"n":"Eeli Tolvanen","pos":"R","gp":17,"toi":15.4,"pim":8,"pts":9,"f":0,"teams":[]},{"n":"Eetu Luostarinen","pos":"C","gp":73,"toi":15.33,"pim":53,"pts":34,"f":0,"teams":[]},{"n":"Egor Chinakhov","pos":"R","gp":6,"toi":14.42,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Elias Lindholm","pos":"C","gp":31,"toi":19.87,"pim":12,"pts":21,"f":0,"teams":[]},{"n":"Elias Pettersson","pos":"C","gp":13,"toi":19.13,"pim":2,"pts":6,"f":0,"teams":[]},{"n":"Elmer Soderblom","pos":"L","gp":5,"toi":10.75,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Emil Heineman","pos":"L","gp":5,"toi":9.07,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Emil Lilleberg","pos":"D","gp":17,"toi":15.53,"pim":10,"pts":1,"f":0,"teams":[]},{"n":"Eric Robinson","pos":"L","gp":34,"toi":11.07,"pim":18,"pts":11,"f":0,"teams":[]},{"n":"Eric Staal","pos":"C","gp":21,"toi":11.63,"pim":12,"pts":5,"f":0,"teams":[]},{"n":"Erik Cernak","pos":"D","gp":41,"toi":19.1,"pim":22,"pts":5,"f":0,"teams":[]},{"n":"Erik Gudbranson","pos":"D","gp":12,"toi":18.03,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Erik Gustafsson","pos":"D","gp":18,"toi":17.25,"pim":8,"pts":4,"f":0,"teams":[]},{"n":"Erik Haula","pos":"L","gp":24,"toi":16.73,"pim":25,"pts":10,"f":1,"teams":["NJD"]},{"n":"Erik Johnson","pos":"D","gp":29,"toi":16.17,"pim":4,"pts":6,"f":0,"teams":[]},{"n":"Erik Karlsson","pos":"D","gp":6,"toi":28.62,"pim":10,"pts":3,"f":0,"teams":[]},{"n":"Esa Lindell","pos":"D","gp":69,"toi":23.25,"pim":22,"pts":13,"f":0,"teams":[]},{"n":"Evan Bouchard","pos":"D","gp":81,"toi":23.67,"pim":38,"pts":88,"f":0,"teams":[]},{"n":"Evan Rodrigues","pos":"C","gp":59,"toi":15.93,"pim":20,"pts":40,"f":0,"teams":[]},{"n":"Evander Kane","pos":"L","gp":68,"toi":17.3,"pim":164,"pts":42,"f":1,"teams":["EDM"]},{"n":"Evgeni Malkin","pos":"C","gp":13,"toi":19.4,"pim":12,"pts":9,"f":0,"teams":[]},{"n":"Evgenii Dadonov","pos":"L","gp":51,"toi":13.32,"pim":6,"pts":21,"f":0,"teams":[]},{"n":"Evgeny Kuznetsov","pos":"C","gp":16,"toi":14.35,"pim":6,"pts":11,"f":0,"teams":[]},{"n":"Fabian Zetterlund","pos":"L","gp":10,"toi":12.58,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Filip Chytil","pos":"C","gp":33,"toi":13.65,"pim":6,"pts":13,"f":0,"teams":[]},{"n":"Filip Forsberg","pos":"L","gp":10,"toi":20.3,"pim":8,"pts":7,"f":0,"teams":[]},{"n":"Filip Hronek","pos":"D","gp":13,"toi":21.03,"pim":6,"pts":2,"f":0,"teams":[]},{"n":"Frank Vatrano","pos":"R","gp":20,"toi":15.12,"pim":13,"pts":13,"f":1,"teams":["NYR"]},{"n":"Fraser Minten","pos":"C","gp":6,"toi":15.88,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Freddy Gaudreau","pos":"C","gp":18,"toi":15.95,"pim":4,"pts":4,"f":0,"teams":[]},{"n":"Gabriel Landeskog","pos":"L","gp":38,"toi":19.9,"pim":20,"pts":37,"f":0,"teams":[]},{"n":"Gabriel Vilardi","pos":"C","gp":21,"toi":17.27,"pim":10,"pts":12,"f":0,"teams":[]},{"n":"Gage Goncalves","pos":"C","gp":12,"toi":15.48,"pim":2,"pts":7,"f":0,"teams":[]},{"n":"Garnet Hathaway","pos":"R","gp":21,"toi":11.27,"pim":40,"pts":5,"f":0,"teams":[]},{"n":"Gustav Forsling","pos":"D","gp":78,"toi":23.88,"pim":34,"pts":29,"f":0,"teams":[]},{"n":"Gustav Nyquist","pos":"R","gp":18,"toi":15.75,"pim":4,"pts":9,"f":0,"teams":[]},{"n":"Hampus Lindholm","pos":"D","gp":30,"toi":22.17,"pim":20,"pts":6,"f":0,"teams":[]},{"n":"Haydn Fleury","pos":"D","gp":9,"toi":15.32,"pim":8,"pts":2,"f":0,"teams":[]},{"n":"Hudson Fasching","pos":"R","gp":10,"toi":12.5,"pim":4,"pts":0,"f":0,"teams":[]},{"n":"Ian Cole","pos":"D","gp":39,"toi":16.65,"pim":24,"pts":9,"f":0,"teams":[]},{"n":"Ian Moore","pos":"D","gp":10,"toi":10.1,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Ilya Lyubushkin","pos":"D","gp":30,"toi":15.95,"pim":24,"pts":8,"f":0,"teams":[]},{"n":"Ilya Mikheyev","pos":"R","gp":18,"toi":13.92,"pim":6,"pts":4,"f":0,"teams":[]},{"n":"Ivan Barbashev","pos":"L","gp":74,"toi":15.9,"pim":36,"pts":40,"f":0,"teams":[]},{"n":"Ivan Demidov","pos":"R","gp":24,"toi":16.52,"pim":6,"pts":11,"f":0,"teams":[]},{"n":"J.J. Moser","pos":"D","gp":12,"toi":20.12,"pim":2,"pts":3,"f":0,"teams":[]},{"n":"J.T. Compher","pos":"L","gp":27,"toi":16.0,"pim":10,"pts":10,"f":0,"teams":[]},{"n":"J.T. Miller","pos":"C","gp":13,"toi":21.45,"pim":8,"pts":12,"f":0,"teams":[]},{"n":"JJ Peterka","pos":"R","gp":6,"toi":13.63,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Jaccob Slavin","pos":"D","gp":74,"toi":23.23,"pim":10,"pts":26,"f":0,"teams":[]},{"n":"Jack Drury","pos":"C","gp":44,"toi":12.57,"pim":20,"pts":15,"f":0,"teams":[]},{"n":"Jack Eichel","pos":"C","gp":62,"toi":21.22,"pim":30,"pts":65,"f":0,"teams":[]},{"n":"Jack Hughes","pos":"C","gp":12,"toi":19.73,"pim":2,"pts":11,"f":0,"teams":[]},{"n":"Jack Johnson","pos":"D","gp":27,"toi":12.57,"pim":14,"pts":0,"f":0,"teams":[]},{"n":"Jack Quinn","pos":"R","gp":13,"toi":16.43,"pim":0,"pts":7,"f":0,"teams":[]},{"n":"Jack Roslovic","pos":"C","gp":31,"toi":13.67,"pim":8,"pts":13,"f":0,"teams":[]},{"n":"Jackson Blake","pos":"R","gp":34,"toi":17.45,"pim":40,"pts":26,"f":0,"teams":[]},{"n":"Jackson LaCombe","pos":"D","gp":12,"toi":26.88,"pim":4,"pts":10,"f":0,"teams":[]},{"n":"Jacob Middleton","pos":"D","gp":29,"toi":18.55,"pim":14,"pts":6,"f":0,"teams":[]},{"n":"Jacob Trouba","pos":"D","gp":55,"toi":23.22,"pim":57,"pts":13,"f":1,"teams":["NYR"]},{"n":"Jaden Schwartz","pos":"L","gp":14,"toi":18.25,"pim":2,"pts":10,"f":0,"teams":[]},{"n":"Jake DeBrusk","pos":"L","gp":27,"toi":17.2,"pim":14,"pts":21,"f":0,"teams":[]},{"n":"Jake Evans","pos":"C","gp":24,"toi":16.63,"pim":24,"pts":11,"f":0,"teams":[]},{"n":"Jake Guentzel","pos":"C","gp":30,"toi":21.5,"pim":32,"pts":33,"f":0,"teams":[]},{"n":"Jake McCabe","pos":"D","gp":31,"toi":21.48,"pim":16,"pts":7,"f":0,"teams":[]},{"n":"Jake Muzzin","pos":"D","gp":7,"toi":22.18,"pim":2,"pts":3,"f":0,"teams":[]},{"n":"Jake Neighbours","pos":"L","gp":7,"toi":17.85,"pim":16,"pts":6,"f":0,"teams":[]},{"n":"Jake Sanderson","pos":"D","gp":9,"toi":26.85,"pim":4,"pts":5,"f":0,"teams":[]},{"n":"Jake Walman","pos":"D","gp":28,"toi":19.47,"pim":20,"pts":14,"f":0,"teams":[]},{"n":"Jakob Chychrun","pos":"D","gp":10,"toi":23.88,"pim":6,"pts":5,"f":0,"teams":[]},{"n":"Jakub Lauko","pos":"C","gp":8,"toi":8.27,"pim":6,"pts":2,"f":0,"teams":[]},{"n":"Jalen Chatfield","pos":"D","gp":54,"toi":19.73,"pim":44,"pts":15,"f":0,"teams":[]},{"n":"James van Riemsdyk","pos":"L","gp":11,"toi":11.77,"pim":0,"pts":5,"f":0,"teams":[]},{"n":"Jamie Benn","pos":"L","gp":67,"toi":15.57,"pim":97,"pts":31,"f":0,"teams":[]},{"n":"Jamie Drysdale","pos":"D","gp":10,"toi":22.18,"pim":10,"pts":4,"f":0,"teams":[]},{"n":"Jamie Oleksiak","pos":"D","gp":14,"toi":21.1,"pim":8,"pts":3,"f":0,"teams":[]},{"n":"Jan Rutta","pos":"D","gp":17,"toi":13.15,"pim":17,"pts":5,"f":1,"teams":["TBL"]},{"n":"Jani Hakanpää","pos":"D","gp":22,"toi":19.82,"pim":20,"pts":4,"f":0,"teams":[]},{"n":"Jared McCann","pos":"L","gp":8,"toi":14.53,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Jared Spurgeon","pos":"D","gp":29,"toi":21.95,"pim":12,"pts":7,"f":0,"teams":[]},{"n":"Jaret Anderson-Dolan","pos":"C","gp":9,"toi":7.95,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Jason Robertson","pos":"L","gp":62,"toi":19.02,"pim":6,"pts":52,"f":0,"teams":[]},{"n":"Jason Spezza","pos":"C","gp":5,"toi":8.07,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Jason Zucker","pos":"L","gp":24,"toi":14.32,"pim":8,"pts":9,"f":0,"teams":[]},{"n":"Jayden Struble","pos":"D","gp":14,"toi":11.77,"pim":14,"pts":0,"f":0,"teams":[]},{"n":"Jean-Gabriel Pageau","pos":"C","gp":10,"toi":17.23,"pim":0,"pts":3,"f":0,"teams":[]},{"n":"Jeff Carter","pos":"C","gp":7,"toi":17.43,"pim":6,"pts":5,"f":0,"teams":[]},{"n":"Jeff Malott","pos":"L","gp":10,"toi":5.75,"pim":14,"pts":0,"f":0,"teams":[]},{"n":"Jeff Skinner","pos":"L","gp":5,"toi":12.22,"pim":0,"pts":2,"f":0,"teams":[]},{"n":"Jeff Viel","pos":"L","gp":12,"toi":12.17,"pim":17,"pts":4,"f":1,"teams":["ANA"]},{"n":"Jeremy Lauzon","pos":"D","gp":21,"toi":17.22,"pim":12,"pts":1,"f":0,"teams":[]},{"n":"Jesper Boqvist","pos":"C","gp":27,"toi":9.77,"pim":0,"pts":6,"f":0,"teams":[]},{"n":"Jesper Bratt","pos":"L","gp":17,"toi":19.65,"pim":4,"pts":9,"f":0,"teams":[]},{"n":"Jesper Fast","pos":"R","gp":29,"toi":16.13,"pim":2,"pts":10,"f":0,"teams":[]},{"n":"Jesperi Kotkaniemi","pos":"C","gp":54,"toi":13.47,"pim":28,"pts":14,"f":0,"teams":[]},{"n":"Jesse Puljujarvi","pos":"R","gp":23,"toi":10.48,"pim":2,"pts":4,"f":0,"teams":[]},{"n":"Jimmy Snuggerud","pos":"R","gp":7,"toi":17.08,"pim":0,"pts":4,"f":0,"teams":[]},{"n":"Jimmy Vesey","pos":"L","gp":19,"toi":10.6,"pim":12,"pts":4,"f":0,"teams":[]},{"n":"Joe Pavelski","pos":"C","gp":40,"toi":18.13,"pim":6,"pts":24,"f":0,"teams":[]},{"n":"Joel Armia","pos":"R","gp":8,"toi":12.52,"pim":8,"pts":2,"f":0,"teams":[]},{"n":"Joel Edmundson","pos":"D","gp":17,"toi":20.07,"pim":8,"pts":3,"f":0,"teams":[]},{"n":"Joel Eriksson Ek","pos":"C","gp":19,"toi":20.18,"pim":18,"pts":13,"f":0,"teams":[]},{"n":"Joel Hanley","pos":"D","gp":20,"toi":12.58,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Joel Kiviranta","pos":"L","gp":42,"toi":11.17,"pim":12,"pts":8,"f":0,"teams":[]},{"n":"Johan Larsson","pos":"L","gp":6,"toi":10.37,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"John Beecher","pos":"C","gp":12,"toi":10.72,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"John Carlson","pos":"D","gp":32,"toi":24.85,"pim":10,"pts":16,"f":0,"teams":[]},{"n":"John Klingberg","pos":"D","gp":30,"toi":18.78,"pim":28,"pts":9,"f":2,"teams":["DAL"]},{"n":"John Marino","pos":"D","gp":25,"toi":22.8,"pim":2,"pts":6,"f":0,"teams":[]},{"n":"John Tavares","pos":"C","gp":38,"toi":18.7,"pim":18,"pts":23,"f":0,"teams":[]},{"n":"Johnny Gaudreau","pos":"L","gp":12,"toi":19.57,"pim":2,"pts":14,"f":0,"teams":[]},{"n":"Jon Merrill","pos":"D","gp":10,"toi":15.6,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Jonah Gadjovich","pos":"L","gp":16,"toi":7.62,"pim":33,"pts":3,"f":1,"teams":["FLA"]},{"n":"Jonas Brodin","pos":"D","gp":23,"toi":23.45,"pim":6,"pts":5,"f":0,"teams":[]},{"n":"Jonas Siegenthaler","pos":"D","gp":14,"toi":22.02,"pim":14,"pts":3,"f":0,"teams":[]},{"n":"Jonathan Aspirot","pos":"D","gp":6,"toi":16.32,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Jonathan Drouin","pos":"L","gp":10,"toi":17.52,"pim":2,"pts":6,"f":0,"teams":[]},{"n":"Jonathan Huberdeau","pos":"L","gp":10,"toi":20.78,"pim":4,"pts":5,"f":0,"teams":[]},{"n":"Jonathan Marchessault","pos":"R","gp":29,"toi":17.73,"pim":16,"pts":29,"f":0,"teams":[]},{"n":"Jordan Eberle","pos":"R","gp":14,"toi":18.12,"pim":6,"pts":11,"f":0,"teams":[]},{"n":"Jordan Greenway","pos":"L","gp":19,"toi":11.92,"pim":12,"pts":5,"f":0,"teams":[]},{"n":"Jordan Kyrou","pos":"R","gp":19,"toi":16.43,"pim":4,"pts":12,"f":0,"teams":[]},{"n":"Jordan Martinook","pos":"L","gp":66,"toi":16.02,"pim":40,"pts":28,"f":0,"teams":[]},{"n":"Jordan Spence","pos":"D","gp":17,"toi":15.88,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Jordan Staal","pos":"C","gp":74,"toi":17.22,"pim":33,"pts":31,"f":1,"teams":["CAR"]},{"n":"Joseph Veleno","pos":"C","gp":9,"toi":8.78,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Josh Anderson","pos":"R","gp":24,"toi":15.07,"pim":50,"pts":8,"f":0,"teams":[]},{"n":"Josh Archibald","pos":"R","gp":13,"toi":9.45,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Josh Doan","pos":"R","gp":13,"toi":16.32,"pim":8,"pts":10,"f":0,"teams":[]},{"n":"Josh Mahura","pos":"D","gp":21,"toi":13.07,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Josh Manson","pos":"D","gp":52,"toi":17.25,"pim":50,"pts":21,"f":0,"teams":[]},{"n":"Josh Morrissey","pos":"D","gp":20,"toi":21.32,"pim":10,"pts":11,"f":0,"teams":[]},{"n":"Josh Norris","pos":"C","gp":10,"toi":16.88,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Josh Samanski","pos":"C","gp":5,"toi":8.98,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Juraj Slafkovský","pos":"L","gp":24,"toi":19.92,"pim":13,"pts":14,"f":1,"teams":["MTL"]},{"n":"Justin Braun","pos":"D","gp":19,"toi":12.68,"pim":6,"pts":1,"f":0,"teams":[]},{"n":"Justin Brazeau","pos":"R","gp":16,"toi":10.22,"pim":12,"pts":4,"f":0,"teams":[]},{"n":"Justin Dowling","pos":"C","gp":5,"toi":11.25,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Justin Faulk","pos":"D","gp":19,"toi":25.13,"pim":18,"pts":11,"f":0,"teams":[]},{"n":"Justin Holl","pos":"D","gp":13,"toi":18.63,"pim":17,"pts":2,"f":0,"teams":[]},{"n":"Justin Hryckowian","pos":"C","gp":6,"toi":16.13,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Justin Schultz","pos":"D","gp":20,"toi":15.67,"pim":8,"pts":13,"f":0,"teams":[]},{"n":"K'Andre Miller","pos":"D","gp":62,"toi":23.33,"pim":32,"pts":21,"f":0,"teams":[]},{"n":"Kaapo Kakko","pos":"R","gp":41,"toi":12.3,"pim":2,"pts":9,"f":0,"teams":[]},{"n":"Kaedan Korczak","pos":"D","gp":14,"toi":12.15,"pim":0,"pts":3,"f":0,"teams":[]},{"n":"Kaiden Guhle","pos":"D","gp":24,"toi":20.75,"pim":50,"pts":8,"f":0,"teams":[]},{"n":"Kailer Yamamoto","pos":"R","gp":32,"toi":15.32,"pim":30,"pts":16,"f":0,"teams":[]},{"n":"Kasperi Kapanen","pos":"R","gp":25,"toi":15.2,"pim":20,"pts":15,"f":0,"teams":[]},{"n":"Keegan Kolesar","pos":"R","gp":60,"toi":10.38,"pim":64,"pts":7,"f":1,"teams":["VGK"]},{"n":"Kevin Bahl","pos":"D","gp":11,"toi":13.52,"pim":31,"pts":1,"f":1,"teams":["NJD"]},{"n":"Kevin Fiala","pos":"L","gp":20,"toi":19.27,"pim":26,"pts":18,"f":0,"teams":[]},{"n":"Kevin Rooney","pos":"C","gp":15,"toi":11.93,"pim":10,"pts":2,"f":0,"teams":[]},{"n":"Kevin Shattenkirk","pos":"D","gp":6,"toi":12.95,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Kevin Stenlund","pos":"C","gp":35,"toi":12.22,"pim":12,"pts":3,"f":0,"teams":[]},{"n":"Kiefer Sherwood","pos":"L","gp":6,"toi":11.97,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Kirby Dach","pos":"C","gp":19,"toi":10.47,"pim":20,"pts":5,"f":0,"teams":[]},{"n":"Kirill Kaprizov","pos":"L","gp":29,"toi":22.62,"pim":20,"pts":33,"f":0,"teams":[]},{"n":"Klim Kostin","pos":"C","gp":12,"toi":7.73,"pim":9,"pts":5,"f":1,"teams":["EDM"]},{"n":"Kris Letang","pos":"D","gp":13,"toi":27.07,"pim":20,"pts":6,"f":0,"teams":[]},{"n":"Kris Russell","pos":"D","gp":6,"toi":9.62,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Kyle Connor","pos":"L","gp":23,"toi":21.97,"pim":4,"pts":26,"f":0,"teams":[]},{"n":"Kyle MacLean","pos":"C","gp":5,"toi":11.92,"pim":5,"pts":1,"f":1,"teams":["NYI"]},{"n":"Kyle Okposo","pos":"R","gp":17,"toi":8.55,"pim":10,"pts":2,"f":0,"teams":[]},{"n":"Kyle Palmieri","pos":"C","gp":11,"toi":17.8,"pim":16,"pts":8,"f":0,"teams":[]},{"n":"Lane Hutson","pos":"D","gp":24,"toi":25.33,"pim":12,"pts":21,"f":0,"teams":[]},{"n":"Lars Eller","pos":"C","gp":26,"toi":12.52,"pim":2,"pts":4,"f":0,"teams":[]},{"n":"Lawson Crouse","pos":"L","gp":6,"toi":21.55,"pim":2,"pts":5,"f":0,"teams":[]},{"n":"Leo Carlsson","pos":"C","gp":12,"toi":18.15,"pim":0,"pts":11,"f":0,"teams":[]},{"n":"Leon Draisaitl","pos":"C","gp":81,"toi":22.13,"pim":38,"pts":124,"f":0,"teams":[]},{"n":"Lian Bichsel","pos":"D","gp":24,"toi":13.07,"pim":32,"pts":1,"f":0,"teams":[]},{"n":"Logan Cooley","pos":"C","gp":6,"toi":22.35,"pim":10,"pts":3,"f":0,"teams":[]},{"n":"Logan O'Connor","pos":"R","gp":44,"toi":11.72,"pim":31,"pts":12,"f":1,"teams":["COL"]},{"n":"Logan Stankoven","pos":"C","gp":53,"toi":16.32,"pim":12,"pts":32,"f":0,"teams":[]},{"n":"Logan Stanley","pos":"D","gp":17,"toi":11.87,"pim":67,"pts":1,"f":1,"teams":["BUF"]},{"n":"Luke Evangelista","pos":"R","gp":6,"toi":13.38,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Luke Glendening","pos":"C","gp":43,"toi":11.57,"pim":10,"pts":6,"f":0,"teams":[]},{"n":"Luke Schenn","pos":"D","gp":29,"toi":15.93,"pim":43,"pts":2,"f":0,"teams":[]},{"n":"MacKenzie Weegar","pos":"D","gp":16,"toi":21.63,"pim":12,"pts":6,"f":0,"teams":[]},{"n":"Mackenzie MacEachern","pos":"L","gp":8,"toi":11.87,"pim":6,"pts":2,"f":0,"teams":[]},{"n":"Marat Khusnutdinov","pos":"C","gp":6,"toi":15.47,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Marc Staal","pos":"D","gp":21,"toi":20.93,"pim":10,"pts":0,"f":0,"teams":[]},{"n":"Marco Rossi","pos":"C","gp":6,"toi":11.13,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Marcus Foligno","pos":"L","gp":29,"toi":13.92,"pim":63,"pts":10,"f":0,"teams":[]},{"n":"Marcus Johansson","pos":"L","gp":28,"toi":16.0,"pim":2,"pts":10,"f":0,"teams":[]},{"n":"Marcus Pettersson","pos":"D","gp":7,"toi":21.27,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Mark Friedman","pos":"D","gp":6,"toi":10.92,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Mark Giordano","pos":"D","gp":18,"toi":16.92,"pim":13,"pts":4,"f":0,"teams":[]},{"n":"Mark Jankowski","pos":"L","gp":32,"toi":11.32,"pim":18,"pts":8,"f":0,"teams":[]},{"n":"Mark Kastelic","pos":"C","gp":6,"toi":11.42,"pim":11,"pts":1,"f":1,"teams":["BOS"]},{"n":"Mark Scheifele","pos":"C","gp":20,"toi":19.4,"pim":20,"pts":18,"f":0,"teams":[]},{"n":"Mark Stone","pos":"R","gp":56,"toi":19.4,"pim":20,"pts":47,"f":0,"teams":[]},{"n":"Martin Fehervary","pos":"D","gp":10,"toi":20.53,"pim":10,"pts":3,"f":0,"teams":[]},{"n":"Martin Necas","pos":"C","gp":60,"toi":18.52,"pim":8,"pts":39,"f":0,"teams":[]},{"n":"Mason Appleton","pos":"C","gp":23,"toi":15.38,"pim":20,"pts":9,"f":0,"teams":[]},{"n":"Mason Lohrei","pos":"D","gp":14,"toi":16.57,"pim":10,"pts":4,"f":0,"teams":[]},{"n":"Mason Marchment","pos":"L","gp":53,"toi":15.1,"pim":52,"pts":17,"f":0,"teams":[]},{"n":"Mason McTavish","pos":"C","gp":10,"toi":12.42,"pim":2,"pts":6,"f":0,"teams":[]},{"n":"Mathew Barzal","pos":"C","gp":11,"toi":18.95,"pim":6,"pts":7,"f":0,"teams":[]},{"n":"Mathew Dumba","pos":"D","gp":17,"toi":20.27,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Mathieu Joseph","pos":"R","gp":5,"toi":11.47,"pim":12,"pts":1,"f":0,"teams":[]},{"n":"Mats Zuccarello","pos":"R","gp":26,"toi":19.37,"pim":8,"pts":21,"f":0,"teams":[]},{"n":"Matt Boldy","pos":"L","gp":29,"toi":21.2,"pim":14,"pts":24,"f":0,"teams":[]},{"n":"Matt Duchene","pos":"C","gp":47,"toi":17.73,"pim":16,"pts":25,"f":0,"teams":[]},{"n":"Matt Martin","pos":"L","gp":9,"toi":10.12,"pim":32,"pts":1,"f":0,"teams":[]},{"n":"Matt Nieto","pos":"L","gp":7,"toi":11.68,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Matt Rempe","pos":"C","gp":11,"toi":6.12,"pim":10,"pts":1,"f":0,"teams":[]},{"n":"Matt Roy","pos":"D","gp":28,"toi":21.87,"pim":4,"pts":8,"f":0,"teams":[]},{"n":"Matt Savoie","pos":"C","gp":6,"toi":14.28,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Matthew Grzelcyk","pos":"D","gp":12,"toi":16.43,"pim":8,"pts":0,"f":0,"teams":[]},{"n":"Matthew Knies","pos":"L","gp":27,"toi":16.85,"pim":12,"pts":14,"f":0,"teams":[]},{"n":"Matthew Tkachuk","pos":"L","gp":79,"toi":18.88,"pim":158,"pts":79,"f":3,"teams":["CGY","FLA"]},{"n":"Mattias Ekholm","pos":"D","gp":54,"toi":21.68,"pim":28,"pts":27,"f":0,"teams":[]},{"n":"Mattias Janmark","pos":"C","gp":52,"toi":11.75,"pim":28,"pts":13,"f":0,"teams":[]},{"n":"Mattias Samuelsson","pos":"D","gp":13,"toi":22.37,"pim":2,"pts":7,"f":0,"teams":[]},{"n":"Matty Beniers","pos":"C","gp":14,"toi":17.8,"pim":4,"pts":7,"f":0,"teams":[]},{"n":"Matvei Michkov","pos":"R","gp":8,"toi":11.83,"pim":6,"pts":1,"f":0,"teams":[]},{"n":"Mavrik Bourque","pos":"C","gp":10,"toi":14.03,"pim":6,"pts":1,"f":0,"teams":[]},{"n":"Max Crozier","pos":"D","gp":5,"toi":14.47,"pim":4,"pts":0,"f":0,"teams":[]},{"n":"Max Domi","pos":"C","gp":53,"toi":13.55,"pim":95,"pts":30,"f":0,"teams":[]},{"n":"Max Pacioretty","pos":"L","gp":15,"toi":13.3,"pim":6,"pts":9,"f":0,"teams":[]},{"n":"Michael Amadio","pos":"R","gp":30,"toi":13.52,"pim":8,"pts":13,"f":0,"teams":[]},{"n":"Michael Bunting","pos":"L","gp":14,"toi":14.42,"pim":19,"pts":6,"f":0,"teams":[]},{"n":"Michael Carcone","pos":"L","gp":6,"toi":13.92,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Michael Eyssimont","pos":"C","gp":10,"toi":11.87,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Michael McCarron","pos":"C","gp":19,"toi":14.02,"pim":4,"pts":4,"f":0,"teams":[]},{"n":"Michael McLeod","pos":"C","gp":12,"toi":14.78,"pim":15,"pts":6,"f":1,"teams":["NJD"]},{"n":"Michael Raffl","pos":"L","gp":7,"toi":16.0,"pim":19,"pts":3,"f":1,"teams":["DAL"]},{"n":"Michael Stone","pos":"D","gp":9,"toi":13.03,"pim":4,"pts":5,"f":0,"teams":[]},{"n":"Mika Zibanejad","pos":"C","gp":43,"toi":20.78,"pim":12,"pts":44,"f":0,"teams":[]},{"n":"Mikael Backlund","pos":"C","gp":12,"toi":19.55,"pim":8,"pts":8,"f":0,"teams":[]},{"n":"Mikael Granlund","pos":"C","gp":34,"toi":18.58,"pim":12,"pts":23,"f":0,"teams":[]},{"n":"Mike Matheson","pos":"D","gp":31,"toi":24.93,"pim":28,"pts":11,"f":0,"teams":[]},{"n":"Mike Reilly","pos":"D","gp":12,"toi":16.62,"pim":4,"pts":4,"f":0,"teams":[]},{"n":"Mikey Anderson","pos":"D","gp":28,"toi":21.83,"pim":12,"pts":6,"f":0,"teams":[]},{"n":"Mikhail Sergachev","pos":"D","gp":37,"toi":23.62,"pim":38,"pts":19,"f":0,"teams":[]},{"n":"Mikko Rantanen","pos":"R","gp":62,"toi":21.43,"pim":36,"pts":78,"f":0,"teams":[]},{"n":"Milan Lucic","pos":"L","gp":12,"toi":9.38,"pim":33,"pts":1,"f":0,"teams":[]},{"n":"Miles Wood","pos":"L","gp":20,"toi":12.63,"pim":27,"pts":5,"f":1,"teams":["COL"]},{"n":"Miro Heiskanen","pos":"D","gp":59,"toi":27.12,"pim":22,"pts":41,"f":0,"teams":[]},{"n":"Mitch Marner","pos":"R","gp":60,"toi":22.37,"pim":14,"pts":67,"f":0,"teams":[]},{"n":"Mitchell Chaffee","pos":"R","gp":9,"toi":11.67,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Morgan Barron","pos":"C","gp":18,"toi":12.3,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Morgan Geekie","pos":"C","gp":32,"toi":14.77,"pim":24,"pts":13,"f":0,"teams":[]},{"n":"Morgan Rielly","pos":"D","gp":38,"toi":23.15,"pim":27,"pts":28,"f":1,"teams":["TOR"]},{"n":"Nate Schmidt","pos":"D","gp":37,"toi":17.75,"pim":6,"pts":16,"f":0,"teams":[]},{"n":"Nathan Bastian","pos":"R","gp":17,"toi":11.37,"pim":16,"pts":2,"f":0,"teams":[]},{"n":"Nathan MacKinnon","pos":"C","gp":58,"toi":22.43,"pim":24,"pts":71,"f":0,"teams":[]},{"n":"Nathan Walker","pos":"L","gp":11,"toi":12.32,"pim":24,"pts":4,"f":0,"teams":[]},{"n":"Nazem Kadri","pos":"C","gp":29,"toi":17.08,"pim":12,"pts":24,"f":0,"teams":[]},{"n":"Neal Pionk","pos":"D","gp":23,"toi":24.5,"pim":18,"pts":15,"f":0,"teams":[]},{"n":"Nic Dowd","pos":"C","gp":42,"toi":13.73,"pim":26,"pts":7,"f":0,"teams":[]},{"n":"Nick Bjugstad","pos":"C","gp":12,"toi":13.57,"pim":16,"pts":3,"f":0,"teams":[]},{"n":"Nick Blankenburg","pos":"D","gp":5,"toi":9.42,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Nick Cousins","pos":"C","gp":45,"toi":11.83,"pim":38,"pts":9,"f":0,"teams":[]},{"n":"Nick Foligno","pos":"L","gp":24,"toi":11.32,"pim":28,"pts":7,"f":0,"teams":[]},{"n":"Nick Jensen","pos":"D","gp":13,"toi":20.63,"pim":8,"pts":0,"f":0,"teams":[]},{"n":"Nick Leddy","pos":"D","gp":16,"toi":18.32,"pim":4,"pts":6,"f":0,"teams":[]},{"n":"Nick Paul","pos":"L","gp":45,"toi":16.83,"pim":20,"pts":14,"f":0,"teams":[]},{"n":"Nick Perbix","pos":"D","gp":13,"toi":16.37,"pim":6,"pts":4,"f":0,"teams":[]},{"n":"Nick Robertson","pos":"L","gp":9,"toi":9.85,"pim":6,"pts":2,"f":0,"teams":[]},{"n":"Nick Schmaltz","pos":"C","gp":6,"toi":23.13,"pim":2,"pts":4,"f":0,"teams":[]},{"n":"Nick Seeler","pos":"D","gp":10,"toi":15.1,"pim":28,"pts":1,"f":0,"teams":[]},{"n":"Nick Suzuki","pos":"C","gp":24,"toi":22.27,"pim":8,"pts":18,"f":0,"teams":[]},{"n":"Nicklas Backstrom","pos":"C","gp":6,"toi":18.0,"pim":4,"pts":6,"f":0,"teams":[]},{"n":"Nico Hischier","pos":"C","gp":17,"toi":21.1,"pim":2,"pts":11,"f":0,"teams":[]},{"n":"Nico Sturm","pos":"C","gp":29,"toi":9.13,"pim":2,"pts":7,"f":0,"teams":[]},{"n":"Nicolas Aube-Kubel","pos":"R","gp":17,"toi":10.2,"pim":6,"pts":0,"f":0,"teams":[]},{"n":"Nicolas Deslauriers","pos":"L","gp":6,"toi":7.37,"pim":4,"pts":0,"f":0,"teams":[]},{"n":"Nicolas Hague","pos":"D","gp":34,"toi":17.72,"pim":46,"pts":8,"f":2,"teams":["VGK"]},{"n":"Nicolas Roy","pos":"C","gp":53,"toi":13.95,"pim":49,"pts":21,"f":0,"teams":[]},{"n":"Nikita Kucherov","pos":"R","gp":46,"toi":21.08,"pim":39,"pts":50,"f":1,"teams":["TBL"]},{"n":"Nikita Zadorov","pos":"D","gp":31,"toi":19.27,"pim":87,"pts":12,"f":0,"teams":[]},{"n":"Niko Mikkola","pos":"D","gp":65,"toi":18.17,"pim":79,"pts":13,"f":0,"teams":[]},{"n":"Nikolaj Ehlers","pos":"L","gp":32,"toi":18.08,"pim":10,"pts":27,"f":0,"teams":[]},{"n":"Nikolas Matinpalo","pos":"D","gp":10,"toi":16.2,"pim":4,"pts":0,"f":0,"teams":[]},{"n":"Nils Aman","pos":"C","gp":5,"toi":9.45,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Nils Hoglander","pos":"L","gp":11,"toi":10.0,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Nils Lundkvist","pos":"D","gp":16,"toi":7.53,"pim":4,"pts":3,"f":0,"teams":[]},{"n":"Nino Niederreiter","pos":"R","gp":37,"toi":15.82,"pim":26,"pts":17,"f":0,"teams":[]},{"n":"Noah Cates","pos":"L","gp":8,"toi":16.33,"pim":0,"pts":4,"f":0,"teams":[]},{"n":"Noah Dobson","pos":"D","gp":24,"toi":22.02,"pim":10,"pts":4,"f":0,"teams":[]},{"n":"Noah Hanifin","pos":"D","gp":52,"toi":23.15,"pim":8,"pts":20,"f":0,"teams":[]},{"n":"Noah Juulsen","pos":"D","gp":7,"toi":11.43,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Noel Acciari","pos":"C","gp":26,"toi":12.98,"pim":14,"pts":3,"f":0,"teams":[]},{"n":"Oliver Bjorkstrand","pos":"R","gp":18,"toi":16.32,"pim":0,"pts":8,"f":0,"teams":[]},{"n":"Oliver Ekman-Larsson","pos":"D","gp":37,"toi":16.72,"pim":32,"pts":10,"f":0,"teams":[]},{"n":"Oliver Kapanen","pos":"C","gp":10,"toi":7.92,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Oliver Kylington","pos":"D","gp":12,"toi":16.25,"pim":8,"pts":3,"f":0,"teams":[]},{"n":"Olli Maatta","pos":"D","gp":7,"toi":16.92,"pim":0,"pts":0,"f":0,"teams":[]},{"n":"Ondrej Kase","pos":"R","gp":7,"toi":10.37,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Ondrej Palat","pos":"L","gp":40,"toi":17.03,"pim":18,"pts":30,"f":0,"teams":[]},{"n":"Oskar Bäck","pos":"C","gp":17,"toi":12.03,"pim":2,"pts":3,"f":0,"teams":[]},{"n":"Oskar Sundqvist","pos":"C","gp":8,"toi":14.97,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Owen Power","pos":"D","gp":13,"toi":21.47,"pim":0,"pts":6,"f":0,"teams":[]},{"n":"Owen Tippett","pos":"R","gp":6,"toi":17.23,"pim":0,"pts":2,"f":0,"teams":[]},{"n":"Parker Kelly","pos":"C","gp":20,"toi":11.7,"pim":26,"pts":5,"f":0,"teams":[]},{"n":"Parker Wotherspoon","pos":"D","gp":16,"toi":19.27,"pim":18,"pts":3,"f":0,"teams":[]},{"n":"Patric Hornqvist","pos":"R","gp":10,"toi":10.8,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Patrice Bergeron","pos":"C","gp":10,"toi":18.58,"pim":4,"pts":8,"f":0,"teams":[]},{"n":"Patrick Kane","pos":"R","gp":7,"toi":17.37,"pim":6,"pts":6,"f":0,"teams":[]},{"n":"Patrick Maroon","pos":"L","gp":42,"toi":9.37,"pim":66,"pts":9,"f":0,"teams":[]},{"n":"Patrik Nemeth","pos":"D","gp":5,"toi":15.8,"pim":8,"pts":0,"f":0,"teams":[]},{"n":"Paul Cotter","pos":"L","gp":5,"toi":14.42,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Paul Stastny","pos":"C","gp":15,"toi":12.3,"pim":4,"pts":4,"f":0,"teams":[]},{"n":"Pavel Buchnevich","pos":"L","gp":19,"toi":19.53,"pim":20,"pts":19,"f":0,"teams":[]},{"n":"Pavel Dorofeyev","pos":"R","gp":31,"toi":16.85,"pim":2,"pts":18,"f":0,"teams":[]},{"n":"Pavel Mintyukov","pos":"D","gp":12,"toi":19.43,"pim":4,"pts":0,"f":0,"teams":[]},{"n":"Pavel Zacha","pos":"C","gp":26,"toi":17.93,"pim":8,"pts":15,"f":0,"teams":[]},{"n":"Peyton Krebs","pos":"C","gp":13,"toi":14.58,"pim":22,"pts":6,"f":0,"teams":[]},{"n":"Philip Broberg","pos":"D","gp":27,"toi":14.0,"pim":6,"pts":5,"f":0,"teams":[]},{"n":"Phillip Danault","pos":"C","gp":43,"toi":18.15,"pim":26,"pts":29,"f":0,"teams":[]},{"n":"Phillip Di Giuseppe","pos":"L","gp":11,"toi":10.38,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Pierre Engvall","pos":"L","gp":18,"toi":15.52,"pim":14,"pts":7,"f":0,"teams":[]},{"n":"Pierre-Edouard Bellemare","pos":"L","gp":29,"toi":10.83,"pim":6,"pts":5,"f":0,"teams":[]},{"n":"Pierre-Luc Dubois","pos":"C","gp":20,"toi":17.48,"pim":40,"pts":8,"f":0,"teams":[]},{"n":"Pius Suter","pos":"C","gp":13,"toi":14.37,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Pontus Holmberg","pos":"R","gp":19,"toi":12.33,"pim":6,"pts":1,"f":0,"teams":[]},{"n":"Porter Martone","pos":"R","gp":10,"toi":16.8,"pim":6,"pts":5,"f":0,"teams":[]},{"n":"Quinn Hughes","pos":"D","gp":24,"toi":27.42,"pim":10,"pts":25,"f":0,"teams":[]},{"n":"Quinton Byfield","pos":"R","gp":23,"toi":17.77,"pim":18,"pts":14,"f":0,"teams":[]},{"n":"Radek Faksa","pos":"C","gp":47,"toi":13.55,"pim":22,"pts":11,"f":0,"teams":[]},{"n":"Radko Gudas","pos":"D","gp":32,"toi":16.03,"pim":40,"pts":5,"f":0,"teams":[]},{"n":"Rasmus Andersson","pos":"D","gp":34,"toi":22.9,"pim":41,"pts":12,"f":1,"teams":["CGY"]},{"n":"Rasmus Dahlin","pos":"D","gp":13,"toi":23.97,"pim":20,"pts":14,"f":0,"teams":[]},{"n":"Rasmus Kupari","pos":"C","gp":11,"toi":7.78,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Rasmus Ristolainen","pos":"D","gp":10,"toi":25.0,"pim":20,"pts":5,"f":0,"teams":[]},{"n":"Rasmus Sandin","pos":"D","gp":11,"toi":21.25,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Reilly Smith","pos":"R","gp":40,"toi":15.7,"pim":20,"pts":20,"f":0,"teams":[]},{"n":"Rickard Rakell","pos":"R","gp":8,"toi":17.67,"pim":0,"pts":4,"f":0,"teams":[]},{"n":"Ridly Greig","pos":"C","gp":10,"toi":18.28,"pim":10,"pts":2,"f":0,"teams":[]},{"n":"Riley Nash","pos":"C","gp":8,"toi":7.48,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Robert Bortuzzo","pos":"D","gp":15,"toi":11.6,"pim":20,"pts":1,"f":0,"teams":[]},{"n":"Robert Thomas","pos":"C","gp":19,"toi":19.58,"pim":14,"pts":14,"f":0,"teams":[]},{"n":"Roman Josi","pos":"D","gp":10,"toi":25.87,"pim":2,"pts":5,"f":0,"teams":[]},{"n":"Roope Hintz","pos":"C","gp":57,"toi":17.83,"pim":26,"pts":48,"f":0,"teams":[]},{"n":"Ross Colton","pos":"C","gp":52,"toi":12.3,"pim":35,"pts":22,"f":1,"teams":["TBL"]},{"n":"Ross Johnston","pos":"L","gp":5,"toi":10.58,"pim":4,"pts":0,"f":0,"teams":[]},{"n":"Ryan Donato","pos":"C","gp":14,"toi":9.08,"pim":12,"pts":2,"f":0,"teams":[]},{"n":"Ryan Graves","pos":"D","gp":10,"toi":19.8,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Ryan Hartman","pos":"R","gp":28,"toi":18.43,"pim":38,"pts":23,"f":0,"teams":[]},{"n":"Ryan Leonard","pos":"R","gp":8,"toi":10.15,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Ryan Lindgren","pos":"D","gp":47,"toi":20.5,"pim":30,"pts":13,"f":0,"teams":[]},{"n":"Ryan Lomberg","pos":"L","gp":26,"toi":9.83,"pim":34,"pts":2,"f":0,"teams":[]},{"n":"Ryan McDonagh","pos":"D","gp":41,"toi":21.75,"pim":26,"pts":10,"f":0,"teams":[]},{"n":"Ryan McLeod","pos":"C","gp":65,"toi":14.55,"pim":28,"pts":18,"f":0,"teams":[]},{"n":"Ryan Nugent-Hopkins","pos":"C","gp":81,"toi":19.92,"pim":34,"pts":72,"f":0,"teams":[]},{"n":"Ryan O'Reilly","pos":"C","gp":29,"toi":21.03,"pim":7,"pts":23,"f":1,"teams":["TOR"]},{"n":"Ryan Poehling","pos":"C","gp":11,"toi":12.77,"pim":4,"pts":5,"f":0,"teams":[]},{"n":"Ryan Pulock","pos":"D","gp":11,"toi":23.98,"pim":6,"pts":7,"f":0,"teams":[]},{"n":"Ryan Reaves","pos":"R","gp":29,"toi":8.97,"pim":28,"pts":1,"f":0,"teams":[]},{"n":"Ryan Shea","pos":"D","gp":6,"toi":16.83,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Ryan Strome","pos":"C","gp":19,"toi":18.3,"pim":10,"pts":9,"f":0,"teams":[]},{"n":"Ryan Suter","pos":"D","gp":50,"toi":20.65,"pim":36,"pts":14,"f":0,"teams":[]},{"n":"Saku Maenalanen","pos":"R","gp":5,"toi":8.52,"pim":12,"pts":1,"f":0,"teams":[]},{"n":"Sam Bennett","pos":"C","gp":72,"toi":17.97,"pim":132,"pts":54,"f":0,"teams":[]},{"n":"Sam Carrick","pos":"C","gp":11,"toi":8.97,"pim":14,"pts":1,"f":0,"teams":[]},{"n":"Sam Lafferty","pos":"C","gp":20,"toi":9.53,"pim":4,"pts":3,"f":0,"teams":[]},{"n":"Sam Malinski","pos":"D","gp":16,"toi":17.4,"pim":4,"pts":4,"f":0,"teams":[]},{"n":"Sam Reinhart","pos":"C","gp":76,"toi":21.4,"pim":32,"pts":56,"f":0,"teams":[]},{"n":"Sam Steel","pos":"C","gp":48,"toi":14.17,"pim":24,"pts":14,"f":0,"teams":[]},{"n":"Samuel Girard","pos":"D","gp":36,"toi":20.07,"pim":6,"pts":11,"f":0,"teams":[]},{"n":"Samuel Helenius","pos":"C","gp":10,"toi":5.5,"pim":14,"pts":1,"f":0,"teams":[]},{"n":"Scott Laughton","pos":"C","gp":17,"toi":14.47,"pim":8,"pts":2,"f":0,"teams":[]},{"n":"Scott Mayfield","pos":"D","gp":6,"toi":21.45,"pim":2,"pts":3,"f":0,"teams":[]},{"n":"Scott Morrow","pos":"D","gp":5,"toi":10.48,"pim":2,"pts":0,"f":0,"teams":[]},{"n":"Scott Perunovich","pos":"D","gp":7,"toi":10.82,"pim":0,"pts":4,"f":0,"teams":[]},{"n":"Sean Couturier","pos":"C","gp":10,"toi":17.47,"pim":8,"pts":4,"f":0,"teams":[]},{"n":"Sean Durzi","pos":"D","gp":19,"toi":18.3,"pim":12,"pts":6,"f":0,"teams":[]},{"n":"Sean Kuraly","pos":"C","gp":6,"toi":12.65,"pim":2,"pts":2,"f":0,"teams":[]},{"n":"Sean Monahan","pos":"C","gp":5,"toi":18.35,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Sean Walker","pos":"D","gp":44,"toi":19.93,"pim":24,"pts":6,"f":0,"teams":[]},{"n":"Sebastian Aho","pos":"D","gp":6,"toi":15.8,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Sebastian Aho","pos":"C","gp":74,"toi":20.6,"pim":44,"pts":62,"f":0,"teams":[]},{"n":"Seth Jarvis","pos":"R","gp":74,"toi":19.17,"pim":14,"pts":54,"f":0,"teams":[]},{"n":"Seth Jones","pos":"D","gp":23,"toi":25.5,"pim":10,"pts":9,"f":0,"teams":[]},{"n":"Shane Pinto","pos":"C","gp":10,"toi":20.58,"pim":4,"pts":2,"f":0,"teams":[]},{"n":"Shayne Gostisbehere","pos":"D","gp":49,"toi":18.23,"pim":24,"pts":24,"f":0,"teams":[]},{"n":"Shea Theodore","pos":"D","gp":61,"toi":23.0,"pim":20,"pts":36,"f":0,"teams":[]},{"n":"Sidney Crosby","pos":"C","gp":12,"toi":20.68,"pim":8,"pts":15,"f":0,"teams":[]},{"n":"Simon Benoit","pos":"D","gp":20,"toi":17.92,"pim":14,"pts":2,"f":0,"teams":[]},{"n":"Stefan Noesen","pos":"R","gp":31,"toi":14.23,"pim":42,"pts":14,"f":2,"teams":["CAR"]},{"n":"Steven Lorentz","pos":"C","gp":34,"toi":9.13,"pim":21,"pts":5,"f":1,"teams":["CAR"]},{"n":"Steven Stamkos","pos":"C","gp":34,"toi":19.13,"pim":36,"pts":29,"f":2,"teams":["TBL"]},{"n":"T.J. Oshie","pos":"R","gp":10,"toi":19.47,"pim":4,"pts":8,"f":0,"teams":[]},{"n":"TJ Brodie","pos":"D","gp":19,"toi":22.82,"pim":18,"pts":5,"f":0,"teams":[]},{"n":"Tage Thompson","pos":"C","gp":13,"toi":19.97,"pim":22,"pts":15,"f":0,"teams":[]},{"n":"Tanner Jeannot","pos":"L","gp":17,"toi":12.47,"pim":13,"pts":3,"f":0,"teams":[]},{"n":"Tanner Pearson","pos":"L","gp":8,"toi":8.82,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Taylor Hall","pos":"L","gp":48,"toi":15.57,"pim":26,"pts":37,"f":0,"teams":[]},{"n":"Taylor Raddysh","pos":"R","gp":7,"toi":11.18,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Teddy Blueger","pos":"C","gp":26,"toi":12.85,"pim":8,"pts":5,"f":0,"teams":[]},{"n":"Teuvo Teravainen","pos":"C","gp":31,"toi":17.7,"pim":4,"pts":18,"f":0,"teams":[]},{"n":"Thomas Chabot","pos":"D","gp":10,"toi":27.42,"pim":4,"pts":4,"f":0,"teams":[]},{"n":"Thomas Harley","pos":"D","gp":62,"toi":22.15,"pim":26,"pts":27,"f":0,"teams":[]},{"n":"Tim Stützle","pos":"C","gp":10,"toi":22.22,"pim":2,"pts":6,"f":0,"teams":[]},{"n":"Tim Washe","pos":"C","gp":12,"toi":13.72,"pim":4,"pts":1,"f":0,"teams":[]},{"n":"Timo Meier","pos":"R","gp":16,"toi":18.42,"pim":28,"pts":8,"f":0,"teams":[]},{"n":"Timothy Liljegren","pos":"D","gp":13,"toi":17.12,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Tom Wilson","pos":"R","gp":15,"toi":18.52,"pim":30,"pts":11,"f":0,"teams":[]},{"n":"Tomas Hertl","pos":"C","gp":40,"toi":15.75,"pim":8,"pts":20,"f":0,"teams":[]},{"n":"Tomas Nosek","pos":"L","gp":30,"toi":11.67,"pim":4,"pts":7,"f":0,"teams":[]},{"n":"Tomas Tatar","pos":"L","gp":16,"toi":13.37,"pim":6,"pts":1,"f":0,"teams":[]},{"n":"Tommy Novak","pos":"C","gp":12,"toi":12.25,"pim":0,"pts":2,"f":0,"teams":[]},{"n":"Tony DeAngelo","pos":"D","gp":23,"toi":19.77,"pim":18,"pts":12,"f":0,"teams":[]},{"n":"Travis Konecny","pos":"R","gp":10,"toi":18.3,"pim":26,"pts":5,"f":0,"teams":[]},{"n":"Travis Sanheim","pos":"D","gp":10,"toi":26.47,"pim":6,"pts":3,"f":0,"teams":[]},{"n":"Trent Frederic","pos":"C","gp":48,"toi":11.42,"pim":71,"pts":9,"f":1,"teams":["EDM"]},{"n":"Trevor Lewis","pos":"C","gp":19,"toi":11.07,"pim":14,"pts":5,"f":0,"teams":[]},{"n":"Trevor Moore","pos":"L","gp":28,"toi":18.77,"pim":20,"pts":15,"f":0,"teams":[]},{"n":"Trevor Zegras","pos":"C","gp":10,"toi":18.08,"pim":26,"pts":6,"f":0,"teams":[]},{"n":"Trevor van Riemsdyk","pos":"D","gp":19,"toi":15.73,"pim":4,"pts":4,"f":0,"teams":[]},{"n":"Troy Stecher","pos":"D","gp":12,"toi":15.12,"pim":2,"pts":4,"f":0,"teams":[]},{"n":"Troy Terry","pos":"R","gp":12,"toi":17.93,"pim":0,"pts":11,"f":0,"teams":[]},{"n":"Ty Dellandrea","pos":"C","gp":22,"toi":14.25,"pim":24,"pts":4,"f":0,"teams":[]},{"n":"Ty Emberson","pos":"D","gp":15,"toi":10.57,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Tye Kartye","pos":"L","gp":10,"toi":12.35,"pim":2,"pts":5,"f":0,"teams":[]},{"n":"Tyler Bertuzzi","pos":"L","gp":14,"toi":18.25,"pim":32,"pts":14,"f":0,"teams":[]},{"n":"Tyler Bozak","pos":"C","gp":12,"toi":9.68,"pim":0,"pts":2,"f":0,"teams":[]},{"n":"Tyler Kleven","pos":"D","gp":8,"toi":16.57,"pim":8,"pts":2,"f":0,"teams":[]},{"n":"Tyler Motte","pos":"C","gp":27,"toi":11.5,"pim":18,"pts":3,"f":0,"teams":[]},{"n":"Tyler Myers","pos":"D","gp":17,"toi":19.55,"pim":10,"pts":1,"f":0,"teams":[]},{"n":"Tyler Seguin","pos":"C","gp":63,"toi":16.6,"pim":20,"pts":34,"f":0,"teams":[]},{"n":"Tyler Toffoli","pos":"C","gp":17,"toi":15.72,"pim":6,"pts":7,"f":0,"teams":[]},{"n":"Tyson Barrie","pos":"D","gp":17,"toi":18.27,"pim":10,"pts":6,"f":0,"teams":[]},{"n":"Tyson Foerster","pos":"R","gp":10,"toi":18.42,"pim":6,"pts":1,"f":0,"teams":[]},{"n":"Tyson Hinds","pos":"D","gp":9,"toi":11.02,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Tyson Jost","pos":"C","gp":6,"toi":11.6,"pim":4,"pts":0,"f":0,"teams":[]},{"n":"Tyson Kozak","pos":"C","gp":6,"toi":11.42,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Uvis Balinskis","pos":"D","gp":5,"toi":12.58,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Valeri Nichushkin","pos":"R","gp":49,"toi":19.38,"pim":10,"pts":34,"f":0,"teams":[]},{"n":"Vasily Podkolzin","pos":"R","gp":30,"toi":11.92,"pim":35,"pts":16,"f":1,"teams":["EDM"]},{"n":"Victor Hedman","pos":"D","gp":38,"toi":24.65,"pim":12,"pts":32,"f":0,"teams":[]},{"n":"Victor Olofsson","pos":"L","gp":9,"toi":14.37,"pim":0,"pts":4,"f":0,"teams":[]},{"n":"Viktor Arvidsson","pos":"L","gp":30,"toi":14.38,"pim":8,"pts":19,"f":0,"teams":[]},{"n":"Vince Dunn","pos":"D","gp":14,"toi":23.17,"pim":22,"pts":7,"f":0,"teams":[]},{"n":"Vincent Desharnais","pos":"D","gp":28,"toi":15.68,"pim":30,"pts":3,"f":0,"teams":[]},{"n":"Vincent Trocheck","pos":"C","gp":37,"toi":20.32,"pim":34,"pts":31,"f":0,"teams":[]},{"n":"Vladimir Tarasenko","pos":"R","gp":54,"toi":14.58,"pim":6,"pts":27,"f":0,"teams":[]},{"n":"Vladislav Gavrikov","pos":"D","gp":17,"toi":20.87,"pim":4,"pts":5,"f":0,"teams":[]},{"n":"Vladislav Namestnikov","pos":"C","gp":29,"toi":15.3,"pim":36,"pts":11,"f":0,"teams":[]},{"n":"Warren Foegele","pos":"L","gp":57,"toi":12.22,"pim":43,"pts":15,"f":0,"teams":[]},{"n":"Will Cuylle","pos":"L","gp":16,"toi":11.28,"pim":8,"pts":2,"f":0,"teams":[]},{"n":"William Borgen","pos":"D","gp":14,"toi":17.68,"pim":8,"pts":3,"f":0,"teams":[]},{"n":"William Carrier","pos":"L","gp":59,"toi":10.5,"pim":40,"pts":11,"f":0,"teams":[]},{"n":"William Karlsson","pos":"C","gp":55,"toi":17.38,"pim":6,"pts":34,"f":0,"teams":[]},{"n":"William Nylander","pos":"R","gp":35,"toi":19.12,"pim":14,"pts":35,"f":0,"teams":[]},{"n":"Wyatt Johnston","pos":"C","gp":62,"toi":19.45,"pim":14,"pts":38,"f":0,"teams":[]},{"n":"Yakov Trenin","pos":"C","gp":29,"toi":11.15,"pim":14,"pts":8,"f":0,"teams":[]},{"n":"Yanni Gourde","pos":"C","gp":26,"toi":17.57,"pim":24,"pts":15,"f":0,"teams":[]},{"n":"Zac Dalpe","pos":"C","gp":13,"toi":6.1,"pim":2,"pts":1,"f":0,"teams":[]},{"n":"Zach Benson","pos":"L","gp":13,"toi":17.1,"pim":64,"pts":9,"f":0,"teams":[]},{"n":"Zach Bogosian","pos":"D","gp":42,"toi":12.7,"pim":15,"pts":5,"f":0,"teams":[]},{"n":"Zach Hyman","pos":"L","gp":74,"toi":19.85,"pim":40,"pts":62,"f":0,"teams":[]},{"n":"Zach Parise","pos":"L","gp":17,"toi":14.72,"pim":2,"pts":3,"f":0,"teams":[]},{"n":"Zach Whitecloud","pos":"D","gp":39,"toi":17.85,"pim":31,"pts":10,"f":1,"teams":["VGK"]},{"n":"Zachary Aston-Reese","pos":"L","gp":6,"toi":8.88,"pim":0,"pts":1,"f":0,"teams":[]},{"n":"Zachary Bolduc","pos":"R","gp":26,"toi":11.9,"pim":38,"pts":8,"f":0,"teams":[]},{"n":"Zack Kassian","pos":"R","gp":16,"toi":8.12,"pim":12,"pts":4,"f":0,"teams":[]},{"n":"Zemgus Girgensons","pos":"C","gp":12,"toi":11.37,"pim":4,"pts":0,"f":0,"teams":[]}],"enforcers":[{"n":"Mathieu Olivier","pos":"R","gp":3,"pim":12},{"n":"Ryan Reaves","pos":"R","gp":29,"pim":28},{"n":"Nicolas Deslauriers","pos":"L","gp":6,"pim":4},{"n":"Arber Xhekaj","pos":"D","gp":16,"pim":32}],"cards":{"2021-22_CAR_Steven-Lorentz":{"name":"Steven Lorentz","team":"CAR","pos":"C","pim":21,"num":"","img":""},"2021-22_CGY_Matthew-Tkachuk":{"name":"Matthew Tkachuk","team":"CGY","pos":"L","pim":158,"num":"","img":""},"2021-22_CGY_Rasmus-Andersson":{"name":"Rasmus Andersson","team":"CGY","pos":"D","pim":41,"num":"","img":""},"2021-22_COL_Logan-O-Connor":{"name":"Logan O'Connor","team":"COL","pos":"R","pim":31,"num":"","img":""},"2021-22_DAL_John-Klingberg":{"name":"John Klingberg","team":"DAL","pos":"D","pim":28,"num":"","img":""},"2021-22_DAL_Michael-Raffl":{"name":"Michael Raffl","team":"DAL","pos":"L","pim":19,"num":"","img":""},"2021-22_FLA_Aaron-Ekblad":{"name":"Aaron Ekblad","team":"FLA","pos":"D","pim":85,"num":"","img":""},"2021-22_NYR_Alexis-Lafreniere":{"name":"Alexis Lafrenière","team":"NYR","pos":"L","pim":17,"num":"","img":""},"2021-22_NYR_Frank-Vatrano":{"name":"Frank Vatrano","team":"NYR","pos":"R","pim":13,"num":"","img":""},"2021-22_NYR_Jacob-Trouba":{"name":"Jacob Trouba","team":"NYR","pos":"D","pim":57,"num":"","img":""},"2021-22_TBL_Brandon-Hagel":{"name":"Brandon Hagel","team":"TBL","pos":"L","pim":45,"num":"","img":""},"2021-22_TBL_Jan-Rutta":{"name":"Jan Rutta","team":"TBL","pos":"D","pim":17,"num":"","img":""},"2021-22_TBL_Ross-Colton":{"name":"Ross Colton","team":"TBL","pos":"C","pim":35,"num":"","img":""},"2021-22_TBL_Steven-Stamkos":{"name":"Steven Stamkos","team":"TBL","pos":"C","pim":36,"num":"","img":""},"2021-22_TOR_Morgan-Rielly":{"name":"Morgan Rielly","team":"TOR","pos":"D","pim":27,"num":"","img":""},"2021-22_WSH_Anthony-Mantha":{"name":"Anthony Mantha","team":"WSH","pos":"R","pim":35,"num":"","img":""},"2022-23_BOS_Derek-Forbort":{"name":"Derek Forbort","team":"BOS","pos":"D","pim":31,"num":"","img":""},"2022-23_CAR_Stefan-Noesen":{"name":"Stefan Noesen","team":"CAR","pos":"R","pim":42,"num":"","img":""},"2022-23_EDM_Brett-Kulak":{"name":"Brett Kulak","team":"EDM","pos":"D","pim":49,"num":"","img":""},"2022-23_EDM_Darnell-Nurse":{"name":"Darnell Nurse","team":"EDM","pos":"D","pim":94,"num":"","img":""},"2022-23_EDM_Klim-Kostin":{"name":"Klim Kostin","team":"EDM","pos":"C","pim":9,"num":"","img":""},"2022-23_FLA_Brandon-Montour":{"name":"Brandon Montour","team":"FLA","pos":"D","pim":57,"num":"","img":""},"2022-23_NJD_Erik-Haula":{"name":"Erik Haula","team":"NJD","pos":"L","pim":25,"num":"","img":""},"2022-23_NJD_Kevin-Bahl":{"name":"Kevin Bahl","team":"NJD","pos":"D","pim":31,"num":"","img":""},"2022-23_NJD_Michael-McLeod":{"name":"Michael McLeod","team":"NJD","pos":"C","pim":15,"num":"","img":""},"2022-23_NYR_Barclay-Goodrow":{"name":"Barclay Goodrow","team":"NYR","pos":"C","pim":47,"num":"","img":""},"2022-23_NYR_Braden-Schneider":{"name":"Braden Schneider","team":"NYR","pos":"D","pim":31,"num":"","img":""},"2022-23_TBL_Nikita-Kucherov":{"name":"Nikita Kucherov","team":"TBL","pos":"R","pim":39,"num":"","img":""},"2022-23_TBL_Steven-Stamkos":{"name":"Steven Stamkos","team":"TBL","pos":"C","pim":36,"num":"","img":""},"2022-23_TOR_Auston-Matthews":{"name":"Auston Matthews","team":"TOR","pos":"C","pim":11,"num":"","img":""},"2022-23_TOR_Ryan-O-Reilly":{"name":"Ryan O'Reilly","team":"TOR","pos":"C","pim":7,"num":"","img":""},"2022-23_VGK_Brett-Howden":{"name":"Brett Howden","team":"VGK","pos":"C","pim":41,"num":"","img":""},"2022-23_VGK_Keegan-Kolesar":{"name":"Keegan Kolesar","team":"VGK","pos":"R","pim":64,"num":"","img":""},"2022-23_VGK_Nicolas-Hague":{"name":"Nicolas Hague","team":"VGK","pos":"D","pim":46,"num":"","img":""},"2022-23_VGK_Zach-Whitecloud":{"name":"Zach Whitecloud","team":"VGK","pos":"D","pim":31,"num":"","img":""},"2022-23_WPG_Brenden-Dillon":{"name":"Brenden Dillon","team":"WPG","pos":"D","pim":13,"num":"","img":""},"2023-24_BOS_David-Pastrnak":{"name":"David Pastrnak","team":"BOS","pos":"R","pim":37,"num":"","img":""},"2023-24_CAR_Stefan-Noesen":{"name":"Stefan Noesen","team":"CAR","pos":"R","pim":42,"num":"","img":""},"2023-24_COL_Miles-Wood":{"name":"Miles Wood","team":"COL","pos":"L","pim":27,"num":"","img":""},"2023-24_EDM_Evander-Kane":{"name":"Evander Kane","team":"EDM","pos":"L","pim":164,"num":"","img":""},"2023-24_FLA_Matthew-Tkachuk":{"name":"Matthew Tkachuk","team":"FLA","pos":"L","pim":158,"num":"","img":""},"2023-24_LAK_Andreas-Englund":{"name":"Andreas Englund","team":"LAK","pos":"D","pim":9,"num":"","img":""},"2023-24_NYI_Kyle-MacLean":{"name":"Kyle MacLean","team":"NYI","pos":"C","pim":5,"num":"","img":""},"2023-24_WPG_Adam-Lowry":{"name":"Adam Lowry","team":"WPG","pos":"C","pim":25,"num":"","img":""},"2024-25_EDM_Darnell-Nurse":{"name":"Darnell Nurse","team":"EDM","pos":"D","pim":94,"num":"","img":""},"2024-25_EDM_Trent-Frederic":{"name":"Trent Frederic","team":"EDM","pos":"C","pim":71,"num":"","img":""},"2024-25_FLA_Jonah-Gadjovich":{"name":"Jonah Gadjovich","team":"FLA","pos":"L","pim":33,"num":"","img":""},"2024-25_VGK_Nicolas-Hague":{"name":"Nicolas Hague","team":"VGK","pos":"D","pim":46,"num":"","img":""},"2025-26_ANA_Jeff-Viel":{"name":"Jeff Viel","team":"ANA","pos":"L","pim":17,"num":"","img":""},"2025-26_BOS_Mark-Kastelic":{"name":"Mark Kastelic","team":"BOS","pos":"C","pim":11,"num":"","img":""},"2025-26_BUF_Logan-Stanley":{"name":"Logan Stanley","team":"BUF","pos":"D","pim":67,"num":"","img":""},"2025-26_CAR_Jordan-Staal":{"name":"Jordan Staal","team":"CAR","pos":"C","pim":33,"num":"","img":""},"2025-26_EDM_Vasily-Podkolzin":{"name":"Vasily Podkolzin","team":"EDM","pos":"R","pim":35,"num":"","img":""},"2025-26_MTL_Juraj-Slafkovsky":{"name":"Juraj Slafkovský","team":"MTL","pos":"L","pim":13,"num":"","img":""},"2025-26_OTT_Brady-Tkachuk":{"name":"Brady Tkachuk","team":"OTT","pos":"L","pim":19,"num":"","img":""},"2025-26_TBL_Brandon-Hagel":{"name":"Brandon Hagel","team":"TBL","pos":"L","pim":45,"num":"","img":""}}};

const TEAMS = {
  ANA: "Anaheim Ducks", BOS: "Boston Bruins", BUF: "Buffalo Sabres", CAR: "Carolina Hurricanes",
  CGY: "Calgary Flames", COL: "Colorado Avalanche", DAL: "Dallas Stars", EDM: "Edmonton Oilers",
  FLA: "Florida Panthers", LAK: "Los Angeles Kings", MTL: "Montreal Canadiens", NJD: "New Jersey Devils",
  NYI: "New York Islanders", NYR: "New York Rangers", OTT: "Ottawa Senators", TBL: "Tampa Bay Lightning",
  TOR: "Toronto Maple Leafs", VGK: "Vegas Golden Knights", WPG: "Winnipeg Jets", WSH: "Washington Capitals"
};
// Logos load from the NHL's public asset host. If one fails, the button shows the team code instead.
const LOGO_URL = abbr => `https://assets.nhle.com/logos/nhl/svg/${abbr}_light.svg`;
const POS = { L: "Left wing", R: "Right wing", C: "Center", D: "Defense" };

/* ---------------------------------------------------------------------
   2. HELPERS
   --------------------------------------------------------------------- */
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SEASONS = DATA.seasons.map(d => d.s);
const state = { team: null, season: null, step: -1 };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ord = n => ["", "1st", "2nd", "3rd"][n];
const fmtDate = iso => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const shortDate = iso => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fightHasTeam = (f, t) => !t || f.t1 === t || f.t2 === t;
const initials = n => n.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("");
const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const share = (a, fn) => a.filter(fn).length / a.length;

// Summary numbers used in captions and story copy, computed from DATA so text can never drift from the charts.
const STATS = (() => {
  const all = DATA.skaters, fi = all.filter(d => d.f > 0), F = DATA.fights;
  const lateThird = F.filter(f => f.per === 3 && f.sec >= 16 * 60).length;
  return {
    total: F.length,
    listedTotal: DATA.seasons.reduce((a, s) => a + s.listed, 0),
    pending: DATA.seasons.reduce((a, s) => a + (s.listed - s.itemized), 0),
    nF: fi.length, nAll: all.length,
    fToi: median(fi.map(d => d.toi)), bToi: median(all.map(d => d.toi)),
    fUnder: fi.filter(d => d.toi < 12).length,
    fUnderPct: share(fi, d => d.toi < 12), bUnderPct: share(all, d => d.toi < 12),
    fPim: median(fi.map(d => d.pim / d.gp)), bPim: median(all.filter(d => !d.f).map(d => d.pim / d.gp)),
    fStars: fi.filter(d => d.pts / d.gp >= 0.8).length,
    fD: share(fi, d => d.pos === "D"), bD: share(all, d => d.pos === "D"),
    first: F.filter(f => f.per === 1).length, second: F.filter(f => f.per === 2).length,
    third: F.filter(f => f.per === 3).length, late: lateThird
  };
})();

function fillStats() {
  $$("[data-stat]").forEach(el => {
    const v = STATS[el.dataset.stat], fmt = el.dataset.fmt;
    el.textContent = fmt === "1" ? v.toFixed(1) : fmt === "2" ? v.toFixed(2) : fmt === "pct" ? Math.round(v * 100) + "%" : v;
  });
}

/* ---- tooltip -------------------------------------------------------- */
const tip = $("#tooltip");
function placeTip(x, y) {
  const pad = 14, r = tip.getBoundingClientRect();
  let left = x + pad, top = y + pad;
  if (left + r.width > innerWidth - 8) left = x - r.width - pad;
  if (top + r.height > innerHeight - 8) top = y - r.height - pad;
  tip.style.left = Math.max(8, left) + "px";
  tip.style.top = Math.max(8, top) + "px";
}
function showTip(html, x, y) { tip.innerHTML = html; tip.hidden = false; placeTip(x, y); }
function hideTip() { tip.hidden = true; }
// Wire hover + keyboard focus + touch to any D3 selection.
function bindTip(selection, htmlFn) {
  selection
    .on("mouseenter mousemove", (e, d) => showTip(htmlFn(d), e.clientX, e.clientY))
    .on("mouseleave blur", hideTip)
    .on("focus", (e, d) => { const b = e.currentTarget.getBoundingClientRect(); showTip(htmlFn(d), b.x + b.width / 2, b.y); });
}

/* ---- trading card reveal (opens when a fight is clicked) ----------- */
// Approximate primary and secondary team colors, used for placeholder cards.
const TEAM_COLORS = {
  ANA: ["#F47A38", "#111111"], BOS: ["#FFB81C", "#111111"], BUF: ["#002654", "#FCB514"], CAR: ["#CC0000", "#111111"],
  CGY: ["#D2001C", "#FAAF19"], COL: ["#6F263D", "#236192"], DAL: ["#006847", "#111111"], EDM: ["#041E42", "#FF4C00"],
  FLA: ["#C8102E", "#041E42"], LAK: ["#111111", "#A2AAAD"], MTL: ["#AF1E2D", "#192168"], NJD: ["#CE1126", "#111111"],
  NYI: ["#00539B", "#F47D30"], NYR: ["#0038A8", "#CE1126"], OTT: ["#C52032", "#111111"], TBL: ["#002868", "#FFFFFF"],
  TOR: ["#00205B", "#FFFFFF"], VGK: ["#B4975A", "#333F42"], WPG: ["#041E42", "#004C97"], WSH: ["#C8102E", "#041E42"]
};
const PIM_NOTE = "*PIM is the player's total playoff penalty minutes across the five postseasons, 2021-22 to 2025-26. It is not the minutes from this fight.";
const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const cardModal = $("#card-modal");
const cardFor = (f, side) => { const id = side === 1 ? f.c1 : f.c2; return { id, ...(DATA.cards[id] || {}) }; };

// Black or white text, whichever reads better on a team color.
function readableOn(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#111111" : "#ffffff";
}

// Drawn stand-in used until a real card PNG is linked (or if a link fails to load).
function placeholderCard(c) {
  const [c1, c2] = TEAM_COLORS[c.team] || ["#001f33", "#99e2e0"];
  const last = c.name.split(" ").slice(1).join(" ") || c.name;
  return `<div class="tcard-art tcard-ph" role="img" aria-label="Placeholder card for ${esc(c.name)}, ${esc(TEAMS[c.team] || c.team)}" style="--tc:${c1};--tc2:${c2};--tcfg:${readableOn(c1)}">
    <span class="ph-code" aria-hidden="true">${c.team}</span>
    <span class="ph-oval" aria-hidden="true"><b>${esc(initials(c.name))}</b></span>
    <span class="ph-plate" aria-hidden="true">${esc(last)}</span>
    <span class="ph-soon" aria-hidden="true">Card art coming</span>
  </div>`;
}
function tcardHTML(c, f) {
  const art = c.img
    ? `<div class="tcard-art"><img class="tcard-img" src="${esc(c.img)}" alt="${esc(c.alt || `Trading card: ${c.name}, ${TEAMS[c.team] || c.team}, ${f.s}`)}"></div>`
    : placeholderCard(c);
  const win = norm(c.name) === norm(f.w);
  return `<article class="tcard">
    ${win ? `<span class="tcard-win">Fan-vote winner</span>` : ""}
    ${art}
    <dl class="tcard-info">
      <div><dt>Name</dt><dd class="nm">${esc(c.name)}</dd></div>
      <div><dt>Team</dt><dd>${esc(TEAMS[c.team] || c.team)}</dd></div>
      <div><dt>Position</dt><dd>${esc(POS[c.pos] || c.pos || "Not listed")}</dd></div>
      <div><dt>Number</dt><dd>${c.num ? "#" + esc(c.num) : "Not yet added"}</dd></div>
      <div><dt>PIM*</dt><dd>${c.pim ?? "Not listed"}</dd></div>
    </dl>
  </article>`;
}
function openFightCard(f) {
  $("#card-modal-title").textContent = `${f.p1} vs. ${f.p2}`;
  $("#card-modal-sub").textContent = `${fmtDate(f.date)}, ${ord(f.per)} period, ${f.t} elapsed`;
  $("#card-pair").innerHTML = tcardHTML(cardFor(f, 1), f) + tcardHTML(cardFor(f, 2), f);
  // If a linked image fails to load, swap in the placeholder card instead of a broken image.
  $$("#card-pair .tcard").forEach((el, i) => {
    const img = $("img.tcard-img", el);
    if (img) img.addEventListener("error", () => { img.closest(".tcard-art").outerHTML = placeholderCard(cardFor(f, i + 1)); });
  });
  const pct = Math.round(f.pct * 100);
  $("#card-vote").textContent = `${pct}% of fan voters picked ${f.w}${pct < 50 ? ", with many calling it even" : ""}. Fight rating ${f.rt.toFixed(1)} from ${f.v} votes.`;
  $("#card-video").href = f.url;
  $("#pim-note").textContent = PIM_NOTE;
  hideTip();
  if (typeof cardModal.showModal === "function") cardModal.showModal(); else cardModal.setAttribute("open", "");
  $(".modal-body", cardModal).scrollTop = 0;
}
// Close on the X button or a click on the backdrop. Escape is handled by the dialog itself.
cardModal.addEventListener("click", e => { if (e.target === cardModal || e.target.closest(".modal-close")) cardModal.close(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") hideTip(); });

// cards.json (made from Player_Card_Images.xlsx) adds jersey numbers and card image links.
function loadCardOverrides() {
  return fetch("cards.json", { cache: "no-cache" })
    .then(r => (r.ok ? r.json() : {}))
    .then(o => Object.entries(o).forEach(([id, v]) => { if (DATA.cards[id]) Object.assign(DATA.cards[id], v); }))
    .catch(() => {});
}

/* ---- shared team filter (the rink logos drive it) ------------------ */
const refreshers = [];
const EAST = ["BOS", "BUF", "CAR", "FLA", "MTL", "NJD", "NYI", "NYR", "OTT", "TBL", "TOR", "WSH"];
const teamFights = t => DATA.fights.filter(f => fightHasTeam(f, t));

function setTeam(team) {
  state.team = team;
  $$(".rink-team").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.team === team)));
  $("#rink-teams").classList.toggle("has-pick", !!team);
  $("#clear-team").hidden = !team;
  const n = team ? teamFights(team).length : 0;
  $("#filter-status").textContent = team
    ? `Highlighting ${TEAMS[team] || team} (${n} fight${n === 1 ? "" : "s"}) in every chart`
    : "No team selected. Pick one on the rink to highlight its fights in every chart.";
  renderRinkDetail();
  refreshers.forEach(fn => fn());
}

/* ---------------------------------------------------------------------
   3. VIEWS
   --------------------------------------------------------------------- */

/* ---- View: rink (team logos on an NHL rink; click to flip) --------- */
// Rink geometry is in feet, from the NHL rulebook: 200 x 85 ft, 28 ft corner radius,
// goal lines 11 ft from the end boards, blue lines 75 ft from the end boards,
// faceoff circles 15 ft in radius. Line widths are slightly exaggerated so they read on screen.
const RINK_VB = { x: -2, y: -2, w: 204, h: 89 };

function drawRink(svg) {
  const defs = svg.append("defs");
  defs.append("clipPath").attr("id", "rink-clip").append("rect").attr("x", 0).attr("y", 0).attr("width", 200).attr("height", 85).attr("rx", 28);
  svg.append("rect").attr("class", "rink-ice").attr("x", 0).attr("y", 0).attr("width", 200).attr("height", 85).attr("rx", 28);

  const g = svg.append("g").attr("clip-path", "url(#rink-clip)");
  g.append("rect").attr("class", "rink-red").attr("x", 99.5).attr("y", 0).attr("width", 1).attr("height", 85);          // center red line
  [75, 124].forEach(x => g.append("rect").attr("class", "rink-blue").attr("x", x).attr("y", 0).attr("width", 1).attr("height", 85)); // blue lines
  [10.9, 188.9].forEach(x => g.append("rect").attr("class", "rink-red").attr("x", x).attr("y", 0).attr("width", 0.25).attr("height", 85)); // goal lines

  svg.append("circle").attr("class", "rink-ring-blue").attr("cx", 100).attr("cy", 42.5).attr("r", 15);
  svg.append("circle").attr("class", "rink-dot-blue").attr("cx", 100).attr("cy", 42.5).attr("r", 0.8);
  [[31, 20.5], [31, 64.5], [169, 20.5], [169, 64.5]].forEach(([x, y]) => {
    svg.append("circle").attr("class", "rink-ring-red").attr("cx", x).attr("cy", y).attr("r", 15);
    svg.append("circle").attr("class", "rink-dot-red").attr("cx", x).attr("cy", y).attr("r", 1);
  });
  [[80, 20.5], [80, 64.5], [120, 20.5], [120, 64.5]].forEach(([x, y]) => svg.append("circle").attr("class", "rink-dot-red").attr("cx", x).attr("cy", y).attr("r", 1));

  // Goal creases (6 ft radius) and nets (6 ft wide, 4 ft deep)
  svg.append("path").attr("class", "rink-crease").attr("d", "M11,36.5 A6,6 0 0 1 11,48.5 Z");
  svg.append("path").attr("class", "rink-crease").attr("d", "M189,48.5 A6,6 0 0 1 189,36.5 Z");
  svg.append("rect").attr("class", "rink-net").attr("x", 7).attr("y", 39.5).attr("width", 4).attr("height", 6);
  svg.append("rect").attr("class", "rink-net").attr("x", 189).attr("y", 39.5).attr("width", 4).attr("height", 6);

  svg.append("rect").attr("class", "rink-boards").attr("x", 0).attr("y", 0).attr("width", 200).attr("height", 85).attr("rx", 28);
  svg.append("text").attr("class", "rink-conf").attr("x", 50).attr("y", 7).attr("text-anchor", "middle").text("Eastern Conference");
  svg.append("text").attr("class", "rink-conf").attr("x", 150).attr("y", 7).attr("text-anchor", "middle").text("Western Conference");
}

function buildRink() {
  const svg = d3.select("#svg-rink").attr("viewBox", `${RINK_VB.x} ${RINK_VB.y} ${RINK_VB.w} ${RINK_VB.h}`);
  drawRink(svg);

  // Teams are placed by conference, not by where fights happened: East left of center ice, West right.
  const teams = [...new Set(DATA.fights.flatMap(f => [f.t1, f.t2]))].sort();
  const place = (list, xs) => {
    const rows = Math.ceil(list.length / xs.length);
    return list.map((t, i) => ({ t, x: xs[i % xs.length], y: 42.5 + (Math.floor(i / xs.length) - (rows - 1) / 2) * 20 }));
  };
  const spots = place(teams.filter(t => EAST.includes(t)), [24, 44, 64, 84])
    .concat(place(teams.filter(t => !EAST.includes(t)), [116, 136, 156, 176]));

  $("#rink-teams").innerHTML = spots.map(({ t, x, y }) => {
    const n = teamFights(t).length, name = TEAMS[t] || t;
    const w = Math.min(9, 4.6 + 1.5 * Math.sqrt(n));          // logo width, % of the rink
    return `<button type="button" class="rink-team" data-team="${t}" aria-pressed="false"
        aria-label="${esc(name)}, ${n} fight${n === 1 ? "" : "s"}" title="${esc(name)}: ${n} fight${n === 1 ? "" : "s"}"
        style="left:${((x - RINK_VB.x) / RINK_VB.w * 100).toFixed(2)}%;top:${((y - RINK_VB.y) / RINK_VB.h * 100).toFixed(2)}%;width:${w.toFixed(2)}%">
      <span class="flip">
        <span class="face front"><img src="${LOGO_URL(t)}" alt="" loading="lazy"><span class="logo-fallback" aria-hidden="true">${t}</span></span>
        <span class="face back" aria-hidden="true"><b>${n}</b><i>fight${n === 1 ? "" : "s"}</i></span>
      </span>
    </button>`;
  }).join("");

  $$("#rink-teams img").forEach(img => {
    const fail = () => img.closest(".front").classList.add("nologo");
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });
  $("#rink-teams").addEventListener("click", e => {
    const b = e.target.closest(".rink-team");
    if (b) setTeam(state.team === b.dataset.team ? null : b.dataset.team);
  });
  $("#clear-team").addEventListener("click", () => setTeam(null));
  $("#rink-detail").addEventListener("click", e => {
    const b = e.target.closest(".mini-fight");
    if (b) openFightCard(DATA.fights.find(f => f.id === b.dataset.id));
  });
}

// Who dropped the mitts: players from the selected team, then that team's fights.
function renderRinkDetail() {
  const el = $("#rink-detail"), t = state.team;
  if (!t) { el.innerHTML = `<p class="rink-prompt">Click a team logo to flip it and see who dropped the mitts.</p>`; return; }
  const fs = teamFights(t).sort((a, b) => (a.date < b.date ? 1 : -1));
  const players = {};
  fs.forEach(f => [[f.p1, f.t1], [f.p2, f.t2]].forEach(([p, tt]) => { if (tt === t) players[p] = (players[p] || 0) + 1; }));
  const names = Object.entries(players).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  el.innerHTML = `
    <h4>${esc(TEAMS[t] || t)}: ${fs.length} fight${fs.length === 1 ? "" : "s"}</h4>
    <p class="roster">${names.map(([n, c]) => `<span class="player-chip">${esc(n)}${c > 1 ? ` <b>\u00d7${c}</b>` : ""}</span>`).join("")}</p>
    <ul class="mini-log">${fs.map(f => {
      const mine = f.t1 === t ? f.p1 : f.p2, opp = f.t1 === t ? [f.p2, f.t2] : [f.p1, f.t1];
      return `<li><button type="button" class="mini-fight" data-id="${f.id}">${shortDate(f.date)}: ${esc(mine)} vs. ${esc(opp[0])} (${opp[1]})</button></li>`;
    }).join("")}</ul>`;
}

/* ---- View: decline (unit chart, one dot per fight) ------------------ */
let declineDots, declineAnimated = false;
function buildDecline() {
  const svg = d3.select("#svg-decline");
  const W = 760, H = 430, m = { t: 30, r: 20, b: 52, l: 20 };
  const R = 10, STEP = 24, base = H - m.b;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const x = d3.scaleBand().domain(SEASONS).range([m.l, W - m.r]).padding(0.3);

  svg.append("line").attr("class", "baseline").attr("x1", m.l).attr("x2", W - m.r).attr("y1", base + 4).attr("y2", base + 4);

  const dots = [];
  DATA.seasons.forEach((s, si) => {
    const fs = DATA.fights.filter(f => f.s === s.s).sort((a, b) => (a.date < b.date ? -1 : 1));
    for (let i = 0; i < s.listed; i++) dots.push({ s: s.s, i, si, f: fs[i] || null });
    const cx = x(s.s) + x.bandwidth() / 2;
    svg.append("text").attr("class", "col-count").attr("x", cx).attr("text-anchor", "middle")
      .attr("y", base - 2 * R - (s.listed - 1) * STEP - 8).text(s.listed);
    svg.append("text").attr("class", "col-label").attr("x", cx).attr("text-anchor", "middle").attr("y", base + 30).text(s.s);
  });

  declineDots = svg.selectAll("g.fight-dot").data(dots).join("g")
    .attr("class", d => "fight-dot" + (d.f ? "" : " pending"))
    .attr("transform", d => `translate(${x(d.s) + x.bandwidth() / 2},${base - R - d.i * STEP})`)
    .attr("tabindex", 0)
    .attr("role", d => (d.f ? "button" : "img"))
    .attr("aria-label", d => d.f ? `${d.f.p1} versus ${d.f.p2}, ${shortDate(d.f.date)}. Open trading cards.` : `Fight listed by HockeyFights.com, details not yet collected, ${d.s}`)
    .on("click", (e, d) => { if (d.f) openFightCard(d.f); })
    .on("keydown", (e, d) => { if (d.f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openFightCard(d.f); } });
  // Wyman-style badge: a solid disc with a ring inside it. Uncollected fights are an empty dashed disc.
  declineDots.append("circle").attr("class", "disc").attr("r", R);
  declineDots.filter(d => d.f).append("circle").attr("class", "ring").attr("r", R * 0.5);

  bindTip(declineDots, d => d.f
    ? `<strong>${esc(d.f.p1)} vs. ${esc(d.f.p2)}</strong><br>${shortDate(d.f.date)}, ${ord(d.f.per)} period<br><em>Click to see the trading cards</em>`
    : `<strong>Not itemized yet</strong><br>HockeyFights.com lists this fight, but it is not in this dataset.`);

  refreshers.push(() => {
    declineDots
      .classed("hit", d => !!(state.team && d.f && fightHasTeam(d.f, state.team)))
      .classed("dim", d => !!(state.team && !(d.f && fightHasTeam(d.f, state.team))));
  });
}
function enterDecline() {
  if (declineAnimated) return;
  declineAnimated = true;
  if (REDUCE) return;
  // One orchestrated moment: dots drop in season by season.
  declineDots.attr("opacity", 0).transition().delay(d => d.si * 260 + d.i * 40).duration(280).attr("opacity", 1);
}

/* ---- View: mirage (guess, then reveal) ------------------------------ */
const fightsFor = name => DATA.fights.filter(f => f.p1 === name || f.p2 === name).length;
function buildMirage() {
  const wrap = $("#enforcer-cards");
  wrap.innerHTML = DATA.enforcers.map(p => `
    <div class="enf-card">
      <div class="monogram" aria-hidden="true">${esc(initials(p.n))}</div>
      <div>
        <strong>${esc(p.n)}</strong>
        <span class="enf-meta">${POS[p.pos] || p.pos}, ${p.gp} playoff games, ${p.pim} PIM*</span>
        <span class="enf-fights" data-n="${fightsFor(p.n)}">Fights in the log: ?</span>
      </div>
    </div>`).join("");

  const slider = $("#guess"), out = $("#guess-out"), lock = $("#lock-guess"), reset = $("#reset-guess"), result = $("#guess-result");
  slider.addEventListener("input", () => { out.textContent = slider.value; });

  lock.addEventListener("click", () => {
    const total = DATA.enforcers.reduce((a, p) => a + fightsFor(p.n), 0);
    const games = DATA.enforcers.reduce((a, p) => a + p.gp, 0);
    const g = +slider.value;
    $$(".enf-fights", wrap).forEach(el => { el.textContent = `Fights in the log: ${el.dataset.n}`; });
    $$(".enf-card", wrap).forEach(el => el.classList.add("revealed"));
    result.textContent = `You guessed ${g}. The log shows ${total}. Together, these four played ${games} playoff games over five seasons.`;
    slider.disabled = true; lock.hidden = true; reset.hidden = false; reset.focus();
  });
  reset.addEventListener("click", () => {
    $$(".enf-fights", wrap).forEach(el => { el.textContent = "Fights in the log: ?"; });
    $$(".enf-card", wrap).forEach(el => el.classList.remove("revealed"));
    result.textContent = "";
    slider.disabled = false; lock.hidden = false; reset.hidden = true; lock.focus();
  });
}

/* ---- View: regulars (ice time vs penalty minutes) ------------------- */
let regDots;
function buildRegulars() {
  const svg = d3.select("#svg-regulars");
  const W = 760, H = 430, m = { t: 24, r: 24, b: 56, l: 60 }, YMAX = 3;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const sk = DATA.skaters.map(d => ({ ...d, y: d.pim / d.gp }));
  const x = d3.scaleLinear().domain(d3.extent(sk, d => d.toi)).nice().range([m.l, W - m.r]);
  const y = d3.scaleLinear().domain([0, YMAX]).range([H - m.b, m.t]);
  const cy = d => y(Math.min(d.y, YMAX));

  // Shaded "enforcer zone": the minutes range where the classic tough guy plays.
  svg.append("rect").attr("class", "zone").attr("x", x(x.domain()[0])).attr("y", m.t)
    .attr("width", x(12) - x(x.domain()[0])).attr("height", H - m.b - m.t);
  svg.append("text").attr("class", "zone-label").attr("x", x(x.domain()[0]) + 8).attr("y", m.t + 16).text("Under 12 min a night");

  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(6).tickSizeOuter(0));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickSizeOuter(0));
  svg.append("text").attr("class", "axis-title").attr("x", (m.l + W - m.r) / 2).attr("y", H - 14).attr("text-anchor", "middle").text("Average minutes on ice per game");
  svg.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -(m.t + H - m.b) / 2).attr("y", 16).attr("text-anchor", "middle").text("Penalty minutes per game");

  const others = sk.filter(d => !d.f), fighters = sk.filter(d => d.f);
  svg.selectAll("circle.dot-other").data(others).join("circle").attr("class", "dot-other")
    .attr("cx", d => x(d.toi)).attr("cy", cy).attr("r", 3.2);
  regDots = svg.selectAll("circle.dot-fighter").data(fighters).join("circle").attr("class", "dot-fighter")
    .attr("cx", d => x(d.toi)).attr("cy", cy).attr("r", 5.5).attr("tabindex", 0)
    .attr("aria-label", d => `${d.n}, ${d.f} fight${d.f > 1 ? "s" : ""}`);
  bindTip(regDots, d => `<strong>${esc(d.n)}</strong><br>${POS[d.pos] || d.pos}, ${d.gp} playoff games<br>${d.toi.toFixed(1)} min/game, ${d.y.toFixed(2)} PIM/game<br>${d.f} fight${d.f > 1 ? "s" : ""} in the log`);

  // Label the three most-penalized fighters so there is something to hold on to.
  svg.selectAll("text.dot-label").data([...fighters].sort((a, b) => b.y - a.y).slice(0, 3)).join("text")
    .attr("class", "dot-label").attr("x", d => x(d.toi) + 9).attr("y", d => cy(d) + 4).text(d => d.n);

  const clamped = sk.filter(d => d.y > YMAX).length;
  $("#regulars-note").textContent = clamped
    ? `Penalty minutes per game = total playoff PIM* divided by playoff games played. ${clamped} skaters above ${YMAX} per game are drawn at the top edge. Skaters with fewer than 5 playoff games are left out.`
    : "Penalty minutes per game = total playoff PIM* divided by playoff games played. Skaters with fewer than 5 playoff games are left out.";

  refreshers.push(() => {
    regDots
      .classed("hit", d => !!(state.team && d.teams.includes(state.team)))
      .classed("dim", d => !!(state.team && !d.teams.includes(state.team)));
  });
}

/* ---- View: clock (when in the game fights happen) ------------------- */
let clockDots;
function buildClock() {
  const svg = d3.select("#svg-clock");
  const W = 760, H = 440, m = { t: 16, r: 24, b: 48, l: 88 };
  const laneH = (H - m.t - m.b) / 3, R = 8;
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const x = d3.scaleLinear().domain([0, 20]).range([m.l, W - m.r]);
  const laneTop = i => m.t + i * laneH, laneBase = i => laneTop(i) + laneH - 14;

  [0, 1, 2].forEach(i => {
    svg.append("rect").attr("class", "lane-bg").attr("x", m.l).attr("y", laneTop(i) + 2).attr("width", W - m.l - m.r).attr("height", laneH - 4);
    svg.append("text").attr("class", "lane-label").attr("x", m.l - 10).attr("y", laneBase(i) - 4).attr("text-anchor", "end").text(`${ord(i + 1)} period`);
    svg.append("line").attr("class", "lane-line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", laneBase(i)).attr("y2", laneBase(i));
  });
  // Final four minutes of regulation.
  svg.append("rect").attr("class", "final-band").attr("x", x(16)).attr("y", laneTop(2) + 2).attr("width", x(20) - x(16)).attr("height", laneH - 4);
  svg.append("text").attr("class", "band-label").attr("x", x(16) + 6).attr("y", laneTop(2) + 18).text("Last 4 minutes");

  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b + 4})`)
    .call(d3.axisBottom(x).tickValues([0, 5, 10, 15, 20]).tickSizeOuter(0));
  svg.append("text").attr("class", "axis-title").attr("x", (m.l + W - m.r) / 2).attr("y", H - 8).attr("text-anchor", "middle").text("Minutes elapsed in the period");

  // Stack dots that would overlap so every fight stays visible.
  const placed = [];
  [...DATA.fights].sort((a, b) => a.sec - b.sec).forEach(f => {
    const lane = f.per - 1, px = x(f.sec / 60);
    let level = 0;
    while (placed.some(p => p.lane === lane && p.level === level && Math.abs(p.px - px) < 2 * R + 2)) level++;
    placed.push({ f, lane, px, level, py: laneBase(lane) - R - level * (2 * R + 2) });
  });
  clockDots = svg.selectAll("g.fight-dot").data(placed).join("g")
    .attr("class", "fight-dot").attr("transform", d => `translate(${d.px},${d.py})`)
    .attr("tabindex", 0).attr("role", "button")
    .attr("aria-label", d => `${d.f.p1} versus ${d.f.p2}, ${ord(d.f.per)} period at ${d.f.t}. Open trading cards.`)
    .on("click", (e, d) => openFightCard(d.f))
    .on("keydown", (e, d) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFightCard(d.f); } });
  clockDots.append("circle").attr("class", "disc").attr("r", R);
  clockDots.append("circle").attr("class", "ring").attr("r", R * 0.5);
  bindTip(clockDots, d => `<strong>${esc(d.f.p1)} vs. ${esc(d.f.p2)}</strong><br>${shortDate(d.f.date)}<br>${ord(d.f.per)} period, ${esc(d.f.t)} elapsed<br><em>Click to see the trading cards</em>`);

  refreshers.push(() => {
    clockDots
      .classed("hit", d => !!(state.team && fightHasTeam(d.f, state.team)))
      .classed("dim", d => !!(state.team && !fightHasTeam(d.f, state.team)));
  });
}

/* ---- View: log (filterable list of every fight) --------------------- */
function buildLog() {
  const chips = $("#season-chips");
  chips.innerHTML = [`<button type="button" class="chip" data-season="" aria-pressed="true">All seasons</button>`]
    .concat(SEASONS.map(s => `<button type="button" class="chip" data-season="${s}" aria-pressed="false">${s}</button>`)).join("");
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    state.season = b.dataset.season || null;
    $$(".chip", chips).forEach(c => c.setAttribute("aria-pressed", String(c === b)));
    renderLog();
  });
  $("#log-list").addEventListener("click", e => {
    const vc = e.target.closest(".view-cards");
    if (vc) { openFightCard(DATA.fights.find(f => f.id === vc.dataset.id)); return; }
    const row = e.target.closest(".log-row"); if (!row) return;
    const detail = row.nextElementSibling, open = row.getAttribute("aria-expanded") === "true";
    row.setAttribute("aria-expanded", String(!open));
    detail.hidden = open;
  });
  refreshers.push(renderLog);
  renderLog();
}
function renderLog() {
  const list = $("#log-list");
  const rows = DATA.fights
    .filter(f => fightHasTeam(f, state.team) && (!state.season || f.s === state.season))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  $("#log-count").textContent = `Showing ${rows.length} of ${DATA.fights.length} fights`;
  if (!rows.length) {
    list.innerHTML = `<li class="log-empty">No fights match these filters. Clear the team filter or pick another season.</li>`;
    return;
  }
  list.innerHTML = rows.map(f => {
    const pct = Math.round(f.pct * 100);
    return `<li class="log-item">
      <button type="button" class="log-row" aria-expanded="false">
        <span class="log-date">${shortDate(f.date)}</span>
        <span class="log-match">${esc(f.p1)} <span class="vs">vs.</span> ${esc(f.p2)}</span>
        <span class="log-tags"><span class="tag">${f.t1}</span><span class="tag">${f.t2}</span></span>
      </button>
      <div class="log-detail" hidden>
        <p>${ord(f.per)} period, ${esc(f.t)} elapsed.</p>
        <div class="vote" role="img" aria-label="${pct}% of voters picked ${esc(f.w)}"><span style="width:${pct}%"></span></div>
        <p>${pct}% of fan voters picked ${esc(f.w)}. Rating ${f.rt.toFixed(1)}, ${f.v} votes.</p>
        <p><button type="button" class="btn btn-small view-cards" data-id="${f.id}">View trading cards</button>
        <a href="${f.url}" target="_blank" rel="noopener">Watch the video on HockeyFights.com</a></p>
      </div>
    </li>`;
  }).join("");
}

/* ---------------------------------------------------------------------
   4. SCROLL ENGINE
   Each .step in the HTML has data-step. When one crosses a thin band of
   the viewport, its matching view fades in on the sticky panel.
   --------------------------------------------------------------------- */
const VIEWS = [
  { id: "decline",  title: "Playoff fights per season, one dot per fight", enter: enterDecline },
  { id: "rink",     title: "Every team that fought, on the ice" },
  { id: "mirage",   title: "Four well-known fighters, five playoff runs" },
  { id: "regulars", title: "Who fights: ice time against penalty minutes" },
  { id: "clock",    title: "When in the game fights break out" },
  { id: "log",      title: "Every fight in the dataset" },
  { id: "log",      title: "Every fight in the dataset" }
];

// Each step gets its own background (see SECTION THEMES in styles.css).
// "light" keeps the base cream palette, "color" is a saturated light background
// that needs darker muted text, and "dark" swaps ink and surface colors.
const TONES = ["light", "dark", "color", "color", "color", "color", "dark"];

function setStep(i) {
  if (i === state.step) return;
  state.step = i;
  document.body.dataset.step = String(i + 1);
  document.body.dataset.tone = TONES[i] || "light";
  $$(".step").forEach((s, k) => s.classList.toggle("active", k === i));
  const v = VIEWS[i];
  $$(".viz-view").forEach(el => el.classList.toggle("active", el.id === "view-" + v.id));
  $("#panel-title").textContent = v.title;
  hideTip();
  if (v.enter) v.enter();
}

function setupObserver() {
  const steps = $$(".step");
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  // Desktop: watch a band 30-50% down the screen. Mobile: the sticky chart covers the top, so watch the lower band.
  const margin = mobile ? "-62% 0px -8% 0px" : "-30% 0px -50% 0px";
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) setStep(steps.indexOf(en.target)); });
  }, { rootMargin: margin, threshold: 0 });
  steps.forEach(s => io.observe(s));
}

/* ---------------------------------------------------------------------
   INTRO (taped-up title)
   The motion is CSS keyframes in styles.css. This file only:
   1. loads your tape PNGs if they exist (the ice photo is set in styles.css), and
   2. starts the animation by adding .play to the intro.
   --------------------------------------------------------------------- */
function initIntro() {
  const intro = $(".intro");
  if (!intro) return;

  // TAPE IMAGE SLOTS: each <li data-tape="images/..."> in index.html tries to load that PNG.
  // If it loads, the strip switches from flat CSS color to your image (class "has-img").
  // If the file is missing, nothing happens and the flat color stays.
  $$(".tape-pile li[data-tape]").forEach(li => {
    const img = new Image();
    img.onload = () => { li.style.backgroundImage = `url("${li.dataset.tape}")`; li.classList.add("has-img"); };
    img.src = li.dataset.tape;
  });

  intro.classList.add("play");
}

/* ---------------------------------------------------------------------
   INIT
   --------------------------------------------------------------------- */
function init() {
  initIntro();
  if (typeof d3 === "undefined") {
    $("#panel-title").textContent = "The chart library did not load. Check your connection and reload.";
    return;
  }
  loadCardOverrides();
  fillStats();
  buildRink();
  buildDecline();
  buildMirage();
  buildRegulars();
  buildClock();
  buildLog();
  setTeam(null);
  setupObserver();
  setStep(0);
}
document.addEventListener("DOMContentLoaded", init);
