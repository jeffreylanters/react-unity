import IUnityConfig from "./interfaces/IUnityConfig";
import IUnityEvent from "./interfaces/IUnityEvent";
import UnityComponent from "./components/Unity";
import "./declarations/UnityLoader";
import "./declarations/UnityInstance";
import "./declarations/ReactUnityWebGL";
import { loggingService } from "./services/LoggingService";

export default class UnityContent {
  /**
   * the relative path to the build json file generated by Unity.
   * @type {string}
   * @private
   */
  public buildJsonPath: string;

  /**
   * the relative path to the unity loader javascript file.
   * @type {string}
   * @public
   */
  public unityLoaderJsPath: string;

  /**
   * The Unity component binded to this content.
   * @type {UnityComponent}
   * @private
   */
  private unityComponent?: UnityComponent;

  /**
   * The Unity instance binded to this content.
   * @type {UnityInstance}
   * @private
   */
  private unityInstance?: UnityInstance;

  /**
   * the Unity configuration that will be used to start the player.
   * @type {IUnityConfig}
   * @public
   */
  public unityConfig: IUnityConfig;

  /**
   * The registered Unity Events.
   * @type {IUnityEvent[]}
   * @public
   */
  private unityEvents: IUnityEvent[];

  /**
   * The unique ID helps seperating multiple
   * Unity player instances in your react
   * application.
   * @type {number}
   * @public
   */
  public uniqueID: number;

  /**
   * the statis unique ID keeps track of the
   * unique ID's made by other instances.
   * @type {number}
   * @static
   * @public
   */
  public static uniqueID: number = 0;

  /**
   * Creates a new Unity content object. This object can be used
   * @param {string} buildJsonPath the relative path to the build json file generated by Unity.
   * @param {string} unityLoaderJsPath the relative path to the unity loader javascript file.
   * @param {IUnityConfig} unityConfig the Unity configuration that will be used to start the player.
   */
  constructor(
    buildJsonPath: string,
    unityLoaderJsPath: string,
    unityConfig?: IUnityConfig
  ) {
    const _unityConfig = unityConfig || ({} as IUnityConfig);
    this.buildJsonPath = buildJsonPath;
    this.unityLoaderJsPath = unityLoaderJsPath;
    this.uniqueID = ++UnityContent.uniqueID;
    this.unityEvents = [];
    this.unityConfig = {
      modules: _unityConfig.modules || {},
      unityVersion: _unityConfig.unityVersion || "undefined",
      adjustOnWindowResize: _unityConfig.adjustOnWindowResize,
      id: _unityConfig.id || "nill"
    } as IUnityConfig;

    if (typeof (window as any).ReactUnityWebGL === "undefined")
      (window as any).ReactUnityWebGL = {};
  }

  /**
   * Binds a unity component to this content.
   * @param unityComponentInstance the unity component that will be binded to this content.
   * @public
   */
  public setComponentInstance(unityComponentInstance: UnityComponent): void {
    this.unityComponent = unityComponentInstance;
  }

  /**
   * Binds a unity player to this content.
   * @param unityPlayerInstance the unity component that will be binded to this content.
   * @public
   */
  public setUnityInstance(unityInstance: UnityInstance): void {
    this.unityInstance = unityInstance;
  }

  /**
   * Sets the unity players fullscreen mode.
   * @param {boolean} fullscreen
   * @public
   */
  public setFullscreen(fullscreen: boolean): void {
    if (this.unityInstance != null) {
      this.unityInstance.SetFullscreen(fullscreen === true ? 1 : 0);
    }
  }

  /**
   * Quits the Unity Instance and removes it from memory.
   */
  public remove(): void {
    if (
      typeof this.unityInstance !== "undefined" &&
      typeof this.unityInstance.Quit === "function"
    )
      return this.unityInstance.Quit(() => {
        this.triggerUnityEvent("quitted");
        this.unityInstance = undefined;
      });
    return loggingService.warnUnityContentRemoveNotAvailable();
  }

  /**
   * Sends an event to the Unity player that will trigger a function.
   * @param {string} gameObjectName the name of the game object in your Unity scene.
   * @param {string} methodName the name of the public method on the game object.
   * @param {any} parameter an optional parameter to pass along to the method.
   * @public
   */
  public send(
    gameObjectName: string,
    methodName: string,
    parameter?: any
  ): void {
    if (this.unityInstance != null) {
      if (typeof parameter === "undefined") {
        this.unityInstance.SendMessage(gameObjectName, methodName);
      } else {
        this.unityInstance.SendMessage(gameObjectName, methodName, parameter);
      }
    }
  }

  /**
   * Registers an event listener for the Unity player. These can be
   * system events like when the player is initialized or loader and
   * your custom events from Unity.
   * @param {string} eventName the event name
   * @param {Function} eventCallback the event function
   * @returns {any} The Function
   * @public
   */
  public on(eventName: string, eventCallback: Function): any {
    this.unityEvents.push({
      eventName: eventName,
      eventCallback: eventCallback
    });
    (window as any).ReactUnityWebGL[eventName] = (parameter: any) => {
      return eventCallback(parameter);
    };
  }

  /**
   * Triggers an event that has been registered by the on
   * function.
   * @param {string} eventName the event name
   * @param {Function} eventValue the event value
   * @public
   */
  public triggerUnityEvent(eventName: string, eventValue?: any): void {
    for (let _i = 0; _i < this.unityEvents.length; _i++)
      if (this.unityEvents[_i].eventName === eventName)
        this.unityEvents[_i].eventCallback(eventValue);
  }
}
