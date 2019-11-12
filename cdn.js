const OSS = require('ali-oss');
const path = require('path');
const fs = require('fs');

const OSS_KEY_SECRET = process.argv.splice(2)[0];

const client = new OSS({
    region: 'oss-cn-beijing',
    accessKeyId: 'LTAIzLWlLvM1A0bd',
    accessKeySecret: OSS_KEY_SECRET,
    bucket: 'officespace2',
});

const jsDirPath = path.resolve(__dirname, './build/static/js')
const cssDirPath = path.resolve(__dirname, './build/static/css')
const OSS_URL = 'http://officespace2.oss-cn-beijing.aliyuncs.com/';

const findJsFile = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(jsDirPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                const fileList = [];
                files.forEach(fileName => {
                    const fileExtension = fileName.split('.').pop();
                    if (fileExtension === 'js') {
                        fileList.push(`/static/js/${fileName}`);
                    }
                })
                resolve(fileList)
            }
        })
    })
}

const findCssFile = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(cssDirPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                const fileList = [];
                files.forEach(fileName => {
                    const fileExtension = fileName.split('.').pop();
                    if (fileExtension === 'css') {
                        fileList.push(`/static/css/${fileName}`);
                    }
                })
                resolve(fileList)
            }
        })
    })
}

const findAllNeedUploadFileList = () => {
    return Promise.all([findJsFile(), findCssFile()])
}

const htmlPath = path.resolve(__dirname, `./build/index.html`);

findAllNeedUploadFileList().then(res => {
    let originFileList = [...res[0], ...res[1]]
    const upLoadRequestList = [];
    originFileList.forEach(filePath => {
        const fileName = filePath.split('/').pop();
        const filePathResolve = path.resolve(__dirname, `./build/.${filePath}`)
        console.log(fileName)
        console.log(filePath)
        console.log(filePathResolve)
        upLoadRequestList.push(client.put(fileName, filePathResolve))
    })

    Promise.all(upLoadRequestList).then(res => {
        console.log(res);
        const htmlData = fs.readFileSync(htmlPath, 'utf8')
        let changeTtmlData = htmlData;
        originFileList.forEach(item => {
            if (htmlData.indexOf(item) !== -1) {
                console.log('888')
                changeTtmlData = changeTtmlData.replace(item, `${OSS_URL}${item.split('/').pop()}`)
            }
        })
        console.log(changeTtmlData)
        fs.writeFile(htmlPath, changeTtmlData, 'utf8', function (err) {
            if (err) {
                console.log(err)
            } else {
                console.log('wancheng')
            }
        });
    })
})
