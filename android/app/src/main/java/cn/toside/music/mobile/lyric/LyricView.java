package cn.toside.music.mobile.lyric;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.hardware.SensorManager;
import android.hardware.input.InputManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.WindowManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import cn.toside.music.mobile.R;

public class LyricView extends Activity implements View.OnTouchListener {
  LyricSwitchView textView = null;
  WindowManager windowManager = null;
  WindowManager.LayoutParams layoutParams = null;
  final private ReactApplicationContext reactContext;
  final private LyricEvent lyricEvent;

  // private int winWidth = 0;

  private float lastX; //上一次位置的X.Y坐标
  private float lastY;
  private float nowX;  //当前移动位置的X.Y坐标
  private float nowY;
  private float tranX; //悬浮窗移动位置的相对值
  private float tranY;
  private float rawX;
  private float rawY;
  private float prevViewPercentageX = 0;
  private float prevViewPercentageY = 0;
  private float widthPercentage = 1f;

  private float preY = 0;
  // private static boolean isVibrated = false;

  private boolean isLock = false;
  private boolean isSingleLine = false;
  private boolean isShowToggleAnima = false;
  private String unplayColor = "rgba(255, 255, 255, 1)";
  private String playedColor = "rgba(7, 197, 86, 1)";
  private String shadowColor = "rgba(0, 0, 0, 0.15)";
  // private String lastText = "LX Music ^-^";
  private String textX = "LEFT";
  private String textY = "TOP";
  private float alpha = 1f;
  private float textSize = 18f;
  private int maxWidth = 0;
  private int maxHeight = 0;

  private int maxLineNum = 5;
  // private float lineHeight = 1;
  private String currentLyric = "LX Music ^-^";
  private ArrayList<String> currentExtendedLyrics = new ArrayList<>();

  private int mLastRotation;
  private OrientationEventListener orientationEventListener = null;

  final Handler fixViewPositionHandler;
  final Runnable fixViewPositionRunnable = this::updateViewPosition;

  LyricView(ReactApplicationContext reactContext, LyricEvent lyricEvent) {
    this.reactContext = reactContext;
    this.lyricEvent = lyricEvent;
    fixViewPositionHandler = new Handler();
  }

  private void listenOrientationEvent() {
    if (orientationEventListener == null) {
      orientationEventListener = new OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL) {
        @Override
        public void onOrientationChanged(int orientation) {
          Display display = windowManager.getDefaultDisplay();
          int rotation = display.getRotation();
          if(rotation != mLastRotation){
            //rotation changed
            // if (rotation == Surface.ROTATION_90){} // check rotations here
            // if (rotation == Surface.ROTATION_270){} //
            // Log.d("Lyric", "rotation: " + rotation);
            fixViewPositionHandler.postDelayed(fixViewPositionRunnable, 300);
          }
          mLastRotation = rotation;
        }
      };
    }
    // Log.d("Lyric", "orientationEventListener: " + orientationEventListener.canDetectOrientation());
    if (orientationEventListener.canDetectOrientation()) {
      orientationEventListener.enable();
    }
  }
  private void removeOrientationEvent() {
    if (orientationEventListener == null) return;
    orientationEventListener.disable();
    // orientationEventListener = null;
  }

  private int getLayoutParamsFlags() {
    int flag = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
      WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
      WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;

    if (isLock) {
      flag = flag | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
    }

    return flag;
  }

  /**
   * update screen width and height
   * @return has updated
   */
  private boolean updateWH() {
    Display display = windowManager.getDefaultDisplay();
    Point size = new Point();
    display.getRealSize(size);
    if (maxWidth == size.x && maxHeight == size.y) return false;
    maxWidth = size.x;
    maxHeight = size.y;
    return true;
  }

  private void setLayoutParamsHeight() {
    if (textView == null || textView.getPaint() == null) return;
    int lines = isSingleLine ? 1 : maxLineNum;
    int height = textView.getPaint().getFontMetricsInt(null) * lines + textView.getPaddingTop() + textView.getPaddingBottom();
    if (height > maxHeight - 100) height = maxHeight - 100;
    layoutParams.height = height;
    textView.setHeight(height);
  }

  private void fixViewPosition() {
    int maxX = maxWidth - layoutParams.width;
    int x = (int)(maxWidth * prevViewPercentageX);
    if (x < 0) x = 0;
    else if (x > maxX) x = maxX;
    if (layoutParams.x != x) layoutParams.x = x;

    setLayoutParamsHeight();

    int maxY = maxHeight - layoutParams.height;
    int y = (int)(maxHeight * prevViewPercentageY);
    if (y < 0) y = 0;
    else if (y > maxY) y = maxY;
    if (layoutParams.y != y) layoutParams.y = y;
  }

  private void updateViewPosition() {
    if (!updateWH()) return;

    int width = (int)(maxWidth * widthPercentage);
    if (layoutParams.width != width) {
      layoutParams.width = width;
      if (textView != null) textView.setWidth(width);
    }

    fixViewPosition();
    // Log.d("Lyric", "widthPercentage: " + widthPercentage + "  prevViewPercentageX: " + prevViewPercentageX);
    // Log.d("Lyric", "prevViewPercentageY: " + prevViewPercentageY + "  layoutParams.x: " + layoutParams.x);
    // Log.d("Lyric", "layoutParams.y: " + layoutParams.y + "  layoutParams.width: " + layoutParams.width);

    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void sendPositionEvent(float x, float y) {
    WritableMap params = Arguments.createMap();
    params.putDouble("x", x);
    params.putDouble("y", y);
    lyricEvent.sendEvent(lyricEvent.SET_VIEW_POSITION, params);
  }

//  public void permission(){
//    if (Build.VERSION.SDK_INT >= 23) {
//      if(!Settings.canDrawOverlays(this)) {
//        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
//        startActivity(intent);
//        return;
//      } else {
//        //Android6.0以上
//        if (mFloatView!=null && mFloatView.isShow()==false) {
//          mFloatView.show();
//        }
//      }
//    } else {
//      //Android6.0以下，不用动态声明权限
//      if (mFloatView!=null && mFloatView.isShow()==false) {
//        mFloatView.show();
//      }
//    }
//  }
// boolean isLock, String themeColor, float alpha, int lyricViewX, int lyricViewY, String textX, String textY
  public void showLyricView(Bundle options) {
    isLock = options.getBoolean("isLock", isLock);
    isSingleLine = options.getBoolean("isSingleLine", isSingleLine);
    isShowToggleAnima = options.getBoolean("isShowToggleAnima", isShowToggleAnima);
    unplayColor = options.getString("unplayColor", unplayColor);
    playedColor = options.getString("playedColor", playedColor);
    shadowColor = options.getString("shadowColor", shadowColor);
    prevViewPercentageX = (float) options.getDouble("lyricViewX", 0f) / 100f;
    prevViewPercentageY = (float) options.getDouble("lyricViewY", 0f) / 100f;
    textX = options.getString("textX", textX);
    textY = options.getString("textY", textY);
    alpha = (float) options.getDouble("alpha", alpha);
    textSize = (float) options.getDouble("textSize", textSize);
    widthPercentage = (float) options.getDouble("width", 100) / 100f;
    maxLineNum = (int) options.getDouble("maxLineNum", maxLineNum);
    handleShowLyric();
    listenOrientationEvent();
  }
  public void showLyricView() {
    try {
      handleShowLyric();
    } catch (Exception e) {
      Log.e("Lyric", e.getMessage());
      return;
    }
    listenOrientationEvent();
  }
  public static int parseColor(String input) {
    if (input.startsWith("#")) return Color.parseColor(input);
    Pattern c = Pattern.compile("rgba? *\\( *(\\d+), *(\\d+), *(\\d+)(?:, *([\\d.]+))? *\\)");
    Matcher m = c.matcher(input);
    if (m.matches()) {
      int red = Integer.parseInt(m.group(1));
      int green = Integer.parseInt(m.group(2));
      int blue = Integer.parseInt(m.group(3));
      float a = 1;
      if (m.group(4) != null) a = Float.parseFloat(m.group(4));
      return Color.argb((int) (a * 255), red, green, blue);
    }
    return Color.parseColor("#000000");
  }

  private void createTextView() {
    textView = new LyricSwitchView(reactContext, isSingleLine, isShowToggleAnima);
    textView.setText("");
    textView.setText(currentLyric);

    textView.setTextColor(parseColor(playedColor));
    textView.setShadowColor(parseColor(shadowColor));
    textView.setAlpha(alpha);
    textView.setTextSize(textSize);
    // Log.d("Lyric", "alpha: " + alpha + " text size: " + textSize);

    //监听 OnTouch 事件 为了实现"移动歌词"功能
    textView.setOnTouchListener(this);

    textView.setGravity(getTextGravity());

    if (!isSingleLine) {
      textView.setMaxLines(maxLineNum);
    }
  }

  private int getTextGravity() {
    int textPositionX;
    int textPositionY;
    switch (textX) {
      case "CENTER":
        textPositionX = Gravity.CENTER_HORIZONTAL;
        break;
      case "RIGHT":
        textPositionX = Gravity.END;
        break;
      case "LEFT":
      default:
        textPositionX = Gravity.START;
        break;
    }
    switch (textY) {
      case "CENTER":
        textPositionY = Gravity.CENTER_VERTICAL;
        break;
      case "BOTTOM":
        textPositionY = Gravity.BOTTOM;
        break;
      case "TOP":
      default:
        textPositionY = Gravity.TOP;
        break;
    }
    return textPositionX | textPositionY;
  }
  private float getLockedWindowAlpha() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      InputManager inputManager = (InputManager) reactContext.getSystemService(Context.INPUT_SERVICE);
      if (inputManager != null) {
        return Math.min(0.8f, inputManager.getMaximumObscuringOpacityForTouch());
      }
      return 0.8f;
    }
    return 1.0f;
  }

  private void applyLockState() {
    if (textView == null || layoutParams == null) return;
    layoutParams.flags = getLayoutParamsFlags();
    if (isLock) {
      textView.setBackgroundColor(Color.TRANSPARENT);
      textView.setOnTouchListener(null);
      textView.setClickable(false);
      textView.setFocusable(false);
      layoutParams.alpha = getLockedWindowAlpha();
    } else {
      textView.setBackgroundResource(R.drawable.rounded_corner);
      textView.setOnTouchListener(this);
      textView.setClickable(true);
      layoutParams.alpha = 1.0f;
    }
  }

  private void handleShowLyric() {
    if (windowManager == null) {
      windowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
      //设置TextView的属性
      layoutParams = new WindowManager.LayoutParams();

      DisplayMetrics outMetrics = new DisplayMetrics();
      windowManager.getDefaultDisplay().getMetrics(outMetrics);
      // winWidth = (int)(outMetrics.widthPixels * 0.92);
    }

    // 注意，悬浮窗只有一个，而当打开应用的时候才会产生悬浮窗，所以要判断悬浮窗是否已经存在，
    if (textView != null) {
      windowManager.removeView(textView);
    }

    // 使用Application context
    // 创建UI控件，避免Activity销毁导致上下文出现问题,因为现在的悬浮窗是系统级别的，不依赖与Activity存在
    //创建自定义的TextView
    createTextView();

    // layoutParams.type = WindowManager.LayoutParams.TYPE_SYSTEM_ALERT | WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
    // layoutParams.type = WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
    layoutParams.type = Build.VERSION.SDK_INT < Build.VERSION_CODES.O ?
      WindowManager.LayoutParams.TYPE_SYSTEM_ALERT :
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;

    applyLockState();

    // TYPE_SYSTEM_ALERT  系统提示,它总是出现在应用程序窗口之上
    // TYPE_SYSTEM_OVERLAY   系统顶层窗口。显示在其他一切内容之上。此窗口不能获得输入焦点，否则影响锁屏
    // FLAG_NOT_FOCUSABLE 悬浮窗口较小时，后面的应用图标由不可长按变为可长按,不设置这个flag的话，home页的划屏会有问题
    // FLAG_NOT_TOUCH_MODAL不阻塞事件传递到后面的窗口
    layoutParams.gravity = Gravity.TOP | Gravity.START;  //显示在屏幕上中部

    updateWH();

    //悬浮窗的宽高
    // layoutParams.width = WindowManager.LayoutParams.WRAP_CONTENT;
    // layoutParams.height = WindowManager.LayoutParams.WRAP_CONTENT;
    // layoutParams.width= DisplayUtil.dp2px(mContext,55);
    // layoutParams.height= DisplayUtil.dp2px(mContext,55);
    layoutParams.width = (int)(maxWidth * widthPercentage);
    textView.setWidth(layoutParams.width);
    setLayoutParamsHeight();

    //显示位置与指定位置的相对位置差
    layoutParams.x = (int)(maxWidth * prevViewPercentageX);
    layoutParams.y = (int)(maxHeight * prevViewPercentageY);

    fixViewPosition();

    //设置透明
    layoutParams.format = PixelFormat.TRANSPARENT;

    //添加到window中
    windowManager.addView(textView, layoutParams);
  }

  public void setLyric(String text, ArrayList<String> extendedLyrics) {
    if (text.equals("") && text.equals(currentLyric) && extendedLyrics.size() == 0) return;
    currentLyric = text;
    currentExtendedLyrics = extendedLyrics;
    if (textView == null) return;
    if (extendedLyrics.size() > 0 && maxLineNum > 1 && !isSingleLine) {
      int num = maxLineNum - 1;
      StringBuilder textBuilder = new StringBuilder(text);
      for (String lrc : extendedLyrics) {
        textBuilder.append("\n").append(lrc);
        if (--num < 1) break;
      }
      text = textBuilder.toString();
    }
    if (textView == null) return;
    textView.setText(text);
  }

  public void setMaxLineNum(int maxLineNum) {
    this.maxLineNum = maxLineNum;
    if (textView == null) return;
    if (!isSingleLine) textView.setMaxLines(maxLineNum);
    setLayoutParamsHeight();

    int maxY = maxHeight - layoutParams.height;
    int y = layoutParams.y;
    if (y < 0) y = 0;
    else if (y > maxY) y = maxY;
    if (layoutParams.y != y) layoutParams.y = y;

    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setWidth(int width) {
    widthPercentage = width / 100f;
    if (textView == null || windowManager == null) return;
    int centerX = layoutParams.x + layoutParams.width / 2;
    int newWidth = (int) (maxWidth * widthPercentage);
    layoutParams.width = newWidth;
    textView.setWidth(newWidth);

    int maxX = maxWidth - newWidth;
    int oldX = layoutParams.x;
    int x = centerX - newWidth / 2;
    if (x < 0) x = 0;
    else if (x > maxX) x = maxX;
    layoutParams.x = x;

    windowManager.updateViewLayout(textView, layoutParams);
    if (x != oldX && maxWidth > 0) {
      prevViewPercentageX = (float) x / (float) maxWidth;
      sendPositionEvent(prevViewPercentageX * 100f, prevViewPercentageY * 100f);
    }
  }

  public WritableMap setPosition(float xPercent, float yPercent) {
    prevViewPercentageX = xPercent / 100f;
    prevViewPercentageY = yPercent / 100f;
    if (windowManager == null || textView == null) return null;
    updateWH();
    fixViewPosition();
    windowManager.updateViewLayout(textView, layoutParams);
    float fx = maxWidth > 0 ? (float) layoutParams.x / (float) maxWidth : 0f;
    float fy = maxHeight > 0 ? (float) layoutParams.y / (float) maxHeight : 0f;
    prevViewPercentageX = fx;
    prevViewPercentageY = fy;
    WritableMap pos = Arguments.createMap();
    pos.putDouble("x", fx * 100f);
    pos.putDouble("y", fy * 100f);
    return pos;
  }

  @Override
  public boolean onTouch(View v, MotionEvent event) {
    if (isLock) return false;
    int maxX = maxWidth - layoutParams.width;
    int maxY = maxHeight - layoutParams.height;

    switch (event.getAction()){
      case MotionEvent.ACTION_DOWN:
        // 获取按下时的X，Y坐标
        lastX = event.getRawX();
        lastY = event.getRawY();
        rawX = layoutParams.x;
        rawY = layoutParams.y;
        break;
      case MotionEvent.ACTION_MOVE:
        // 获取移动时的X，Y坐标
        nowX = event.getRawX();
        nowY = event.getRawY();
        rawX += nowX - lastX;
        rawY += nowY - lastY;
        if (rawX < 0) rawX = 0;
        else if (rawX > maxX) rawX = maxX;
        if (rawY < 0) rawY = 0;
        else if (rawY > maxY) rawY = maxY;

        int x = (int) rawX;
        int y = (int) rawY;
        int centerX = maxX / 2;
        if (maxX > 0 && Math.abs(x - centerX) < maxWidth * 0.03f) {
          x = centerX;
        }

        // 移动悬浮窗
        layoutParams.x = x;
        layoutParams.y = y;
        //更新悬浮窗位置
        windowManager.updateViewLayout(textView, layoutParams);
        //记录当前坐标作为下一次计算的上一次移动的位置坐标
        lastX = nowX;
        lastY = nowY;
        break;
      case MotionEvent.ACTION_UP:
      case MotionEvent.ACTION_CANCEL:
        float fx = maxWidth > 0 ? (float) layoutParams.x / (float) maxWidth : 0f;
        float fy = maxHeight > 0 ? (float) layoutParams.y / (float) maxHeight : 0f;
        if (fx != prevViewPercentageX || fy != prevViewPercentageY) {
          prevViewPercentageX = fx;
          prevViewPercentageY = fy;
          sendPositionEvent(fx * 100f, fy * 100f);
        }
        break;
    }
    return true;
  }

  public void lockView() {
    isLock = true;
    if (windowManager == null || textView == null) return;
    applyLockState();
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void unlockView() {
    isLock = false;
    if (windowManager == null || textView == null) return;
    applyLockState();
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setColor(String unplayColor, String playedColor, String shadowColor) {
    this.unplayColor = unplayColor;
    this.playedColor = playedColor;
    this.shadowColor = shadowColor;
    if (textView == null) return;
    textView.setTextColor(parseColor(playedColor));
    textView.setShadowColor(parseColor(shadowColor));
    // windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setLyricTextPosition(String textX, String textY) {
    this.textX = textX;
    this.textY = textY;
    if (windowManager == null || textView == null) return;
    textView.setGravity(getTextGravity());
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void setAlpha(float alpha) {
    this.alpha = alpha;
    if (textView == null) return;
    textView.setAlpha(alpha);
  }

  public void setSingleLine(boolean isSingleLine) {
    this.isSingleLine = isSingleLine;
    if (textView == null) return;
    windowManager.removeView(textView);
    createTextView();
    textView.setWidth(layoutParams.width);
    setLayoutParamsHeight();
    int maxY = maxHeight - layoutParams.height;
    int y = layoutParams.y;
    if (y < 0) y = 0;
    else if (y > maxY) y = maxY;
    layoutParams.y = y;
    windowManager.addView(textView, layoutParams);

    if (isLock) lockView();
    else unlockView();

    setLyric(currentLyric, currentExtendedLyrics);
  }

  public void setShowToggleAnima(boolean showToggleAnima) {
    isShowToggleAnima = showToggleAnima;
    if (textView == null) return;
    textView.setShowAnima(showToggleAnima);
  }

  public void setTextSize(float size) {
    this.textSize = size;
    if (windowManager == null || textView == null) return;
    textView.setTextSize(size);
    setLayoutParamsHeight();
    windowManager.updateViewLayout(textView, layoutParams);
  }

  public void destroyView() {
    if (textView == null || windowManager == null) return;
    windowManager.removeView(textView);
    textView = null;
    removeOrientationEvent();
  }

  public void destroy() {
    destroyView();
    windowManager = null;
    layoutParams = null;
  }
}
