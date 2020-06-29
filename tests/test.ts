import {Builder, By, Capabilities, Key, until} from 'selenium-webdriver';
import { expect } from 'chai';
import { driver } from 'mocha-webdriver';


const rootUrl = `http://localhost:3000/`;
const loginUrl = `http://localhost:3000/login`;
const logoutUrl = `http://localhost:3000/logout`;
const quizUrl = `http://localhost:3000/quiz`;
const questionsUrl = `http://localhost:3000/questions`;
const changeUrl = `http://localhost:3000/change`;

let cookies: any;

async function login(name: string, password: string) {
  await driver.get(loginUrl);
  await driver.findElement(By.name('login')).sendKeys(name);
  await driver.findElement(By.name('password')).sendKeys(password);
  await driver.findElement(By.id('login-button')).doClick;

}

async function changePassword(newPassword: string) {
  await driver.findElement(By.name('new_password')).sendKeys(newPassword);
  await driver.findElement(By.name('repeat_new_password')).sendKeys(newPassword);
  await driver.findElement(By.id('change-password')).doClick;
}

async function logout() {
  await driver.get(logoutUrl);
}

async function isLoggedIn() {
  await driver.get(quizUrl);
  return await driver.findElement(By.id('change_password')).then(() => true).catch(() => false);
}

describe("Logout from all sessions", () => {
  it('is logged in', async () => {
    // await driver.get(loginUrl);
    // expect(await driver.getCurrentUrl()).to.equal(loginUrl);
    await login('user1', 'user1');
    expect(await isLoggedIn()).to.equal(true);
  });
  it('got to change password url', async () => {
    await ((await (driver.findElement(By.id('change_password')))).doClick());
    expect(await driver.getCurrentUrl()).to.equal(changeUrl);
  });
  it('deleting cookie and checking that i am logged out', async () => {
    cookies = await driver.manage().getCookie('connect.sid');
    await driver.manage().deleteCookie('connect.sid');
    await changePassword('user1');
    expect(await isLoggedIn()).to.equal(false);
  });

  it('restoring cookie doesnt restore the session', async () => {
    await driver.manage().addCookie({name: cookies.name, value: cookies.value});
    expect(await isLoggedIn()).to.equal(false);

    await login('user1', 'user1');
    expect(await isLoggedIn()).to.equal(true);
  });

});
