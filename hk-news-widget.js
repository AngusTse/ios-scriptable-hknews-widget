// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: file-alt;
/* SCRIPTABLE Hong Kong NEWS WIDGET
 v0.1.0 coded by Angus (https://twitter.com/angus_t)
 
 
 This project used to provide Hong Kong news widget with Scriptable.
 This project inspired from Saudumm (https://github.com/Saudumm/scriptable-News-Widget).  
 
 WIDGET PARAMETER: you can long press on the widget on your homescreen and edit parameters
 - It is comman separated configure. 
  1. Site name [APPLEDAILY, HK01]
  2. Is the feed shows thumbnail [true,false] 
 - example:  
     - `APPLEDAILY`   // showing Apple Daily TW news about Hong Kong
     - `HK01` // showing HK01 hot news 
     - `APPLEDAILY,true` // showing Apple Daily TW news with thumbnail.
 */

const configs = {
  "HK01": {
    SITE_URL: "http://prod-newsfeed.wezeroplus.com/v2/feed/hot",
    SITE_NAME: "HKO1"
  },
  "APPLEDAILY": {
    SITE_URL: "https://mlprd-api.twnextdigital.com/v1/1/Search?Offset=10&Start=0&Sort=time&KeyWord=%E9%A6%99%E6%B8%AF&lang=zh_TW&ABT=%3D&platform=IPHONE&Build=5395&D=&FromCC=HK&CC=TW&S=&TWAD=1&FromD=&FromS=",
    SITE_NAME: "APPLE DAILY TW"
  }
}
const STORAGE_DIR = "hknews-widget-data"
const WIDGET_SIZE_SMALL = "small"
const WIDGET_SIZE_MEDIUM = "medium"
const WIDGET_SIZE_LARGE = "large"

let SITE_URL = configs.HK01.SITE_URL;
let SITE_NAME = configs.HK01.SITE_NAME;
let SHOW_POST_IMAGES = false;

/*
 COLOR CONFIG: You can edit almost all colors of your widget
 Colors are now dynamic, the first value is the color used in light mode, the second value is used in dark mode.
 - FONT_COLOR_SITENAME: font color of the website name (SITE_NAME)
 - FONT_COLOR_POST_DATE: font color of the date/time label
 - FONT_COLOR_HEADLINE: font color of the post title
 */

let BG_COLOR = Color.dynamic(new Color("#fefefe"), new Color("#1c1c1e"));
const FONT_SITENAME = Font.heavySystemFont(10);
const FONT_COLOR_SITENAME = Color.dynamic(new Color("#1c1c1e"), new Color("#fefefe"));
const FONT_COLOR_POST_DATE = Color.dynamic(Color.darkGray(), Color.gray());
const FONT_COLOR_HEADLINE = Color.dynamic(new Color("#1c1c1e"), new Color("#fefefe"));

const WIDGET_SIZE = (config.runsInWidget ? config.widgetFamily : WIDGET_SIZE_LARGE);

// set the number and font size of posts depending on WIDGET_SIZE
let POST_COUNT = 3;
const FONT_POST_DATE = Font.heavySystemFont(10);
const FONT_POST_HEADLINE = Font.heavySystemFont(10);
const POST_IMAGE_SIZE = new Size(30,30);

// set the feed, post count
setWidgetParameters();

// check directories
await checkFileDirs()

// Create Widget
const widget = await createWidget();

if (!config.runsInWidget) {
  switch (WIDGET_SIZE) {
    case "small":
      await widget.presentSmall();
      break;
    case "medium":
      await widget.presentMedium();
      break;
    case "large":
      await widget.presentLarge();
      break;
  }
}

Script.setWidget(widget);
Script.complete();

// create the widget
// parameter: none
// return: an awesome widget
async function createWidget() {
  const postData = await getJSONData();
  
  const list = new ListWidget();
  
  // display name of the website
  const siteName = list.addText(SITE_NAME.toUpperCase());
  siteName.font = FONT_SITENAME;
  siteName.textColor = FONT_COLOR_SITENAME;
  
  list.addSpacer();
  
  if (postData) {
    const aStackRow = await new Array(POST_COUNT);
    const aStackCol = await new Array(POST_COUNT);
    const aLblPostDate = await new Array(POST_COUNT);
    const aLblPostTitle = await new Array(POST_COUNT);
    const aLblPostIMG = await new Array(POST_COUNT);
    
    let i;
    for (i = 0; i < POST_COUNT; i++) {
      aStackRow[i] = list.addStack();
      aStackRow[i].layoutHorizontally();
      aStackRow[i].url = postData.aPostURLs[i];
      
      aStackCol[i] = aStackRow[i].addStack();
      aStackCol[i].layoutVertically();
      
      aLblPostDate[i] = aStackCol[i].addText(await new Date(postData.aPostDates[i]).toLocaleString([], {year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"}));
      aLblPostDate[i].font = FONT_POST_DATE;
      aLblPostDate[i].textColor = FONT_COLOR_POST_DATE;
      aLblPostDate[i].lineLimit = 1;
      aLblPostDate[i].minimumScaleFactor = 0.5;
      
      aLblPostTitle[i] = aStackCol[i].addText(postData.aPostTitles[i]);
      aLblPostTitle[i].font = FONT_POST_HEADLINE;
      aLblPostTitle[i].textColor = FONT_COLOR_HEADLINE;
      aLblPostTitle[i].lineLimit = 2;
      
      if (SHOW_POST_IMAGES && postData.aPostIMGPaths[i] != "none") {
        aStackRow[i].addSpacer();
        let localImage = await loadLocalImage(postData.aPostIMGPaths[i]);
        if (localImage) {
          aLblPostIMG[i] = aStackRow[i].addImage(localImage);
          aLblPostIMG[i].imageSize = POST_IMAGE_SIZE;
          aLblPostIMG[i].cornerRadius = 8;
          aLblPostIMG[i].rightAlignImage();
        }
      }
      
      if (i < POST_COUNT-1) {list.addSpacer();}
    }
  } else {
    siteName.textColor = Color.white();
    
    const sad_face = list.addText(":(")
    sad_face.font = Font.regularSystemFont(WIDGET_SIZE === WIDGET_SIZE_LARGE ? 190 : 72);
    sad_face.textColor = Color.white();
    sad_face.lineLimit = 1;
    sad_face.minimumScaleFactor = 0.1;
    
    list.addSpacer();
    
    const err_msg = list.addText("Couldn't load data");
    err_msg.font = Font.regularSystemFont(12);
    err_msg.textColor = Color.white();
    
    BG_COLOR = new Color("#1f67b1");
  }

  return list;
}

function parseHK01JSONData(item) {
  return {
    date: new Date(item.data.lastModifyTime * 1000),
    title: formatPostTitle(item.data.title),
    url: "https://www.hk01.com/a/"+item.data.articleId,
    imgUrl: item.data.mainImage.cdnUrl,
    id: item.data.articleId
  }
}

function parseAppleDailyHKJSONData(item) {
  return {
    date: new Date(item.updateDate * 1000),
    title: formatPostTitle(item.title),
    url: item.sharing.url,
    imgUrl: item.sharing.image,
    id: item._id
  }
}

// get all the data for the widget - this is where the magic happens
// for WordPress sites
// parameter: nothing at all
// return: arrays with data
async function getJSONData() {
  try {
    const loadedJSON = await new Request(SITE_URL).loadJSON();
    const aPostDates = await new Array(POST_COUNT);
    const aPostTitles = await new Array(POST_COUNT);
    const aPostURLs = await new Array(POST_COUNT);
    const aPostIMGURLs = await new Array(POST_COUNT);
    const aPostIMGPaths = await new Array(POST_COUNT);
    const aPostFileNames = await new Array(POST_COUNT+2);

    for (let i = 0; i < POST_COUNT; i++) {
      let itemObj;
      if (SITE_NAME == configs.HK01.SITE_NAME)
        itemObj = parseHK01JSONData(loadedJSON.items[i]);
      if (SITE_NAME == configs.APPLEDAILY.SITE_NAME)
        itemObj = parseAppleDailyHKJSONData(loadedJSON.content[i])
  
      aPostDates[i] = itemObj.date;
      aPostTitles[i] = itemObj.title;
      
      aPostURLs[i] = itemObj.url
      
      if (SHOW_POST_IMAGES) {
        aPostIMGURLs[i] = itemObj.imgUrl;
        if (aPostIMGURLs[i] != "none") {
          aPostIMGPaths[i] = await getImagePath(itemObj.id);
          aPostFileNames[i] = await getFileName(itemObj.id);
          
          await downloadPostImage(aPostIMGPaths[i], aPostIMGURLs[i]);
        } else {
          aPostIMGPaths[i] = "none";
          aPostFileNames[i] = "none";
        }
      }
    }
    
    if (SHOW_POST_IMAGES) {
      aPostFileNames[5] = aPostFileNames[0]+"-bg";
      aPostFileNames[6] = aPostFileNames[0]+"-bg-blur";
      await cleanUpImages(aPostFileNames);
    }
    
    const result = {
      aPostDates: aPostDates,
      aPostTitles: aPostTitles,
      aPostURLs: aPostURLs,
      aPostIMGPaths: aPostIMGPaths
    };
    
    return result;
  } catch (err) {
    logError(err)
    return null;
  }
}


// format the post title and replace all html entities with characters
// parameter: string of the title
// return: string with the title, readable by a human being
function formatPostTitle(strHeadline) {
  strHeadline = strHeadline.replaceAll("&quot;", '"');
  strHeadline = strHeadline.replaceAll("&amp;", "&");
  strHeadline = strHeadline.replaceAll("&lt;", "<");
  strHeadline = strHeadline.replaceAll("&gt;", ">");
  strHeadline = strHeadline.replaceAll("&apos;", "'");
  strHeadline = strHeadline.replaceAll("&#034;", '"');
  strHeadline = strHeadline.replaceAll("&#038;", "&");
  strHeadline = strHeadline.replaceAll("&#039;", "'");
  strHeadline = strHeadline.replaceAll("&#060;", "<");
  strHeadline = strHeadline.replaceAll("&#062;", ">");
  strHeadline = strHeadline.replaceAll("&#338;", "Œ");
  strHeadline = strHeadline.replaceAll("&#339;", "œ");
  strHeadline = strHeadline.replaceAll("&#352;", "Š");
  strHeadline = strHeadline.replaceAll("&#353;", "š");
  strHeadline = strHeadline.replaceAll("&#376;", "Ÿ");
  strHeadline = strHeadline.replaceAll("&#710;", "ˆ");
  strHeadline = strHeadline.replaceAll("&#732;", "˜");
  strHeadline = strHeadline.replaceAll("&#8211;", "–");
  strHeadline = strHeadline.replaceAll("&#8212;", "—");
  strHeadline = strHeadline.replaceAll("&#8216;", "‘");
  strHeadline = strHeadline.replaceAll("&#8217;", "’");
  strHeadline = strHeadline.replaceAll("&#8218;", "‚");
  strHeadline = strHeadline.replaceAll("&#8220;", "“");
  strHeadline = strHeadline.replaceAll("&#8221;", "”");
  strHeadline = strHeadline.replaceAll("&#8222;", "„");
  strHeadline = strHeadline.replaceAll("&#8224;", "†");
  strHeadline = strHeadline.replaceAll("&#8225;", "‡");
  strHeadline = strHeadline.replaceAll("&#8230;", "…");
  strHeadline = strHeadline.replaceAll("&#8240;", "‰");
  strHeadline = strHeadline.replaceAll("&#8249;", "‹");
  strHeadline = strHeadline.replaceAll("&#8250;", "›");
  strHeadline = strHeadline.replaceAll("&#8364;", "€");
  strHeadline = strHeadline.replaceAll("<![CDATA[", "");
  strHeadline = strHeadline.replaceAll("]]>", "");
  return strHeadline;
}


// set the filename of the post image (site name + image id)
// parameter: id of the image
// return: filename of the image
function getFileName(id) {
  return SITE_NAME.replace(/[^a-zA-Z1-9]+/g, "").toLowerCase()+"-"+id;
}

// set the complete file path for the image
// parameter: id of the image
// return: local filepath of the image
function getImagePath(id) {
  const fm = FileManager.local();
  const docDir = fm.documentsDirectory();
  const fileName = getFileName(id);
  return fm.joinPath(docDir+"/"+STORAGE_DIR+"/image-cache", fileName);
}

// download the post image (if it doesn't already exist)
// parameter: path to the image, url to the image
// return: nothing
async function downloadPostImage(path, url) {
  const fm = FileManager.local();
  
  // check if file already exists
  if (fm.fileExists(path)) {
    return;
  } else if (!fm.fileExists(path)) {
    // download, resize, crop and store image
    let req = await new Request(url);
    let loadedImage = await req.load();
    // write image and read again (it's smaller that way???)
    await fm.write(path, loadedImage);
    loadedImage = await fm.readImage(path);
    loadedImage = await resizeImage(loadedImage, 150);
    loadedImage = await cropImageToSquare(loadedImage);
    await fm.remove(path);
    await fm.writeImage(path, loadedImage);
    return;
  }
  
  return;
}

// load post image from file path
// parameter: path to the image
// return: image
async function loadLocalImage(imgPath) {
  const fm = FileManager.local();
  if (fm.fileExists(imgPath)) {return await fm.readImage(imgPath);}
}

// check if all folders are available and create them if needed
// parameter: none
// return: nothing
function checkFileDirs() {
  // Create new FileManager and set data dir
  const fm = FileManager.local();
  const docDir = fm.documentsDirectory();
  const cacheDir = docDir+"/"+STORAGE_DIR+"/image-cache";
  const cacheDirWP = docDir+"/"+STORAGE_DIR+"/wallpaper-cache";
  
  if (!fm.fileExists(cacheDir)) {fm.createDirectory(cacheDir, true);}
  if (!fm.fileExists(cacheDirWP)) {fm.createDirectory(cacheDirWP, true);}
  
  return;
}

// cleanup post image files
// parameter: array with image filenames that are needed at the moment
// return: nothing
function cleanUpImages(aFileNames) {
  const fm = FileManager.local();
  const docDir = fm.documentsDirectory();
  const cacheDir = docDir+"/"+STORAGE_DIR+"/image-cache";
  
  const aFiles = fm.listContents(cacheDir);
  
  const site_id = SITE_NAME.replace(/[^a-zA-Z1-9]+/g, "").toLowerCase();
  
  let aFilesSite = new Array();
  
  for (i = 0; i < aFiles.length; i++) {
    if (aFiles[i].substring(0, site_id.length) === site_id) {aFilesSite.push(aFiles[i]);}
  }
  
  for (i = 0; i < aFilesSite.length; i++) {
    if (!aFileNames.includes(aFilesSite[i])) {
      let path = fm.joinPath(cacheDir, aFilesSite[i]);
      fm.remove(path);
    }
  }
  return;
}

// resize the background image
// parameter: image, max short side pixels the image should be resized to
// return: resized image (duh)
async function resizeImage(img, maxShortSide) {
  let imgHeight = await img.size.height;
  let imgWidth = await img.size.width;
  let imgShortSide = await Math.min(imgHeight, imgWidth);
  let resizeFactor = await Math.round(imgShortSide/maxShortSide);

  const js = `
    // Set up the canvas
    const img = document.getElementById("resImg");
    const canvas = document.getElementById("mainCanvas");
    const w = img.width;
    const h = img.height;
    const maxW = Math.round(w / ${resizeFactor});
    const maxH = Math.round(h / ${resizeFactor});
    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";
    canvas.width = maxW;
    canvas.height = maxH;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, w, h);
    context.drawImage(img, 0, 0, maxW, maxH);
    
    // Get the image data from the context
    var imageData = context.getImageData(0,0,w,h);
    // Draw over the old image
    context.putImageData(imageData,0,0);
    // Return a base64 representation
    canvas.toDataURL();
  `;
  
  // Convert the images and create the HTML
  let resImgData = await Data.fromPNG(img).toBase64String();
  let html = `<img id="resImg" src="data:image/png;base64,${resImgData}" /><canvas id="mainCanvas" />`;
  
  // Make the web view and get its return value
  let view = new WebView();
  await view.loadHTML(html);
  let returnValue = await view.evaluateJavaScript(js);
  
  // Remove the data type from the string and convert to data
  let imageDataString = await returnValue.slice(22);
  let imageData = await Data.fromBase64String(imageDataString);
  
  // Convert to image before returning
  let imageFromData = await Image.fromData(imageData);
  
  return imageFromData;
}

// crops an image to a square
// parameter: image
// return: square image
async function cropImageToSquare(img) {
  const imgHeight = await img.size.height;
  const imgWidth = await img.size.width;
  
  let imgShortSide = await Math.min(imgHeight, imgWidth);
  let imgLongSide = await Math.max(imgHeight, imgWidth);
  
  if (imgShortSide != imgLongSide) {
    let imgCropTotal = await (imgLongSide - imgShortSide);
    let imgCropSide = await Math.floor(imgCropTotal / 2);

    let rect;
    switch (imgShortSide) {
      case imgHeight:
        rect = new Rect(imgCropSide, 0, imgShortSide, imgShortSide);
        break;
      case imgWidth:
        rect = new Rect(0, imgCropSide, imgShortSide, imgShortSide);
        break;
    }
    
    let draw = new DrawContext();
    draw.size = new Size(rect.width, rect.height);
    
    draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y));
    img = draw.getImage();
  }
  return img;
}

// check and process widget parameters
function setWidgetParameters() {
  if (args.widgetParameter) {
    const [site, showPostImages] = args.widgetParameter.split(",");
    SHOW_POST_IMAGES = (showPostImages === "true");
    switch (site) {
      case 'HK01':
          SITE_URL = configs.HK01.SITE_URL;
          SITE_NAME = configs.HK01.SITE_NAME
          break;
      case 'APPLEDAILY':
          SITE_URL = configs.APPLEDAILY.SITE_URL;
          SITE_NAME = configs.APPLEDAILY.SITE_NAME
          break;
    }
  }

  switch (WIDGET_SIZE) {
    case WIDGET_SIZE_SMALL:
      POST_COUNT = (SHOW_POST_IMAGES)?2 :3;
      break;
    case WIDGET_SIZE_MEDIUM:
      POST_COUNT = (SHOW_POST_IMAGES)?2 :4;
      break;
    case WIDGET_SIZE_LARGE:
      POST_COUNT = (SHOW_POST_IMAGES)?8 :10;
      break;
  }
}

// end of script
