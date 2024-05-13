package com.ialocation.plugin;

import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;
import android.content.Context;

import com.indooratlas.android.sdk.IALocation;
import com.indooratlas.android.sdk.IALocationManager;
import com.indooratlas.android.sdk.IALocationRequest;
import com.indooratlas.android.sdk.IARegion;
import com.indooratlas.android.sdk.IARoute;
import com.indooratlas.android.sdk.IAOrientationRequest;
import com.indooratlas.android.sdk.IAOrientationListener;
import com.indooratlas.android.sdk.IARadioScanRequest;
import com.indooratlas.android.sdk.IAWayfindingListener;
import com.indooratlas.android.sdk.IAWayfindingRequest;
import com.indooratlas.android.sdk.IAGeofence;
import com.indooratlas.android.sdk.IAGeofenceRequest;
import com.indooratlas.android.sdk.resources.IALatLngFloor;
import com.indooratlas.android.sdk.resources.IALatLngFloorCompatible;
// react.native
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.remobile.cordova.CordovaPlugin;
import com.remobile.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import static com.ialocation.plugin.IndoorLocationListener.getRouteJSONFromIARoute;

/**
 * Cordova Plugin which implements IndoorAtlas positioning service.
 * IndoorAtlas.initialize method should always be called before starting positioning session.
 */
public class IALocationPlugin extends CordovaPlugin {
    private static final String TAG = "IALocationPlugin";
    private static final int PERMISSION_REQUEST = 101;

    private IALocationManager mLocationManager;
    private List<String> permissions = new ArrayList<>(Arrays.asList(new String[]{
            Manifest.permission.CHANGE_WIFI_STATE,
            Manifest.permission.ACCESS_WIFI_STATE,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.INTERNET
    }));
    {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_SCAN);
        }
    }
    private CallbackContext mCbContext;
    private IndoorLocationListener mListener;
    private boolean mLocationServiceRunning = false;
    private IALocationRequest mLocationRequest = IALocationRequest.create();
    private IAOrientationRequest mOrientationRequest = new IAOrientationRequest(1.0, 1.0);
    private IARadioScanRequest mRadioScanRequest = null;

    /**
     * Called by the WebView implementation to check for geolocation permissions, can be used
     * by other Java methods in the event that a plugin is using this as a dependency.
     * @return Returns true if the plugin has all the permissions it needs to operate.
     */
    //@Override
    public boolean hasPermisssion() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }
        for (String p : permissions) {
            if (PackageManager.PERMISSION_DENIED == cordova.getActivity().checkSelfPermission(p)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Called by the Plugin Manager when we need to actually request permissions
     * @param requestCode   Passed to the activity to track the request
     *
     */
    //@Override
    public void requestPermissions(int requestCode) {
        cordova.requestPermissions(this, requestCode, permissions.toArray(new String[]{}));
    }

    /**
     * Called by the system when the user grants permissions
     * @param requestCode
     * @param permissions
     * @param grantResults
     * @throws JSONException
     */
    @Override
    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) throws JSONException {
        PluginResult result;
        for (int grantResult : grantResults) {
            if (grantResult == PackageManager.PERMISSION_DENIED) {
                result = new PluginResult(PluginResult.Status.ERROR, PositionError.getErrorObject(PositionError.PERMISSION_DENIED));
                mCbContext.sendPluginResult(result);
                return;
            }
        }
        if (PERMISSION_REQUEST == requestCode) {
            result = new PluginResult(PluginResult.Status.OK);
            mCbContext.sendPluginResult(result);
        }
    }

    /**
     * Executes the request.
     * This method is called from the WebView thread. To do a non-trivial amount of work, use:
     *     cordova.getThreadPool().execute(runnable);
     *     To run on the UI thread, use:
     *     cordova.getActivity().runOnUiThread(runnable);
     * @param action          The action to execute.
     * @param args            The exec() arguments.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return
     * @throws JSONException
     */
    @Override
    public boolean execute(String action, JSONArray args, com.remobile.cordova.CallbackContext realCallbackContext) throws JSONException {
        // react.native
        CallbackContext callbackContext = new CallbackContext(action, realCallbackContext, this);
        try{
            if ("initializeIndoorAtlas".equals(action)) {
                if (validateIAKeys(args)) {
                    String apiKey = args.getString(0);
                    String apiSecret = args.getString(1);
                    String pluginVersion = args.getString(2);
                    initializeIndoorAtlas(apiKey, apiSecret, pluginVersion, callbackContext);
                }
                else {
                    callbackContext.error(PositionError.getErrorObject(PositionError.INVALID_ACCESS_TOKEN));
                }
            } else if ("addWatch".equals(action)) {
                String watchId = args.getString(0);
                addWatch(watchId,callbackContext);
                if (!mLocationServiceRunning) {
                    startPositioning(callbackContext);
                }
            } else if ("clearWatch".equals(action)) {
                String watchId = args.getString(0);
                clearWatch(watchId);
                callbackContext.success();

            } else if ("getLocation".equals(action)) {
                if (mLocationServiceRunning) { //get last known location if service has started.
                    getLastKnownLocation(callbackContext);
                }
                else { //Start service
                    getListener(this).addCallback(callbackContext);
                    startPositioning(callbackContext);
                }
            } else if ("getPermissions".equals(action)) {
                if (hasPermisssion()) {
                    callbackContext.success();
                    return true;
                }
                else {
                    mCbContext = callbackContext;
                    requestPermissions(PERMISSION_REQUEST);
                }
            } else if ("setPosition".equals(action)) {
                setPosition(args, callbackContext);
            } else if ("addRegionWatch".equals(action)) {
                String watchId = args.getString(0);
                if (!mLocationServiceRunning){
                    startPositioning(callbackContext);
                }
                addRegionWatch(watchId, callbackContext);
            } else if ("clearRegionWatch".equals(action)) {
                String watchId = args.getString(0);
                clearRegionWatch(watchId);
                callbackContext.success();
            } else if ("setOutputThresholds".equals(action)) {
                float distance = (float) args.getDouble(0);
                float interval = (float) args.getDouble(1);
                setOutputThresholds(distance, interval, callbackContext);
            } else if ("setPositioningMode".equals(action)) {
              String mode = args.getString(0);
              setPositioningMode(mode, callbackContext);
            } else if ("getTraceId".equals(action)) {
              getTraceId(callbackContext);
            } else if ("getFloorCertainty".equals(action)) {
              getFloorCertainty(callbackContext);
            } else if ("addAttitudeCallback".equals(action)) {
              addAttitudeCallback(callbackContext);
            } else if ("removeAttitudeCallback".equals(action)) {
              removeAttitudeCallback();
            } else if ("addHeadingCallback".equals(action)) {
              addHeadingCallback(callbackContext);
            } else if ("removeHeadingCallback".equals(action)) {
              removeHeadingCallback();
            } else if ("setSensitivities".equals(action)) {
              double orientationSensitivity = args.getDouble(0);
              double headingSensitivity = args.getDouble(1);
              setSensitivities(orientationSensitivity, headingSensitivity, callbackContext);
            } else if ("addStatusChangedCallback".equals(action)) {
              addStatusChangedCallback(callbackContext);
            } else if ("removeStatusCallback".equals(action)) {
              removeStatusCallback();
            } else if ("requestWayfindingUpdates".equals(action)) {
              double lat = args.getDouble(0);
              double lon = args.getDouble(1);
              int floor = args.getInt(2);
              requestWayfindingUpdates(lat, lon, floor, callbackContext);
            } else if ("requestWayfindingRoute".equals(action)) {
              JSONObject _from = args.getJSONObject(0);
              JSONObject _to = args.getJSONObject(1);
              IALatLngFloor from = new IALatLngFloor(
                  _from.getDouble("latitude"),
                  _from.getDouble("longitude"),
                  _from.getInt("floor"));
              IALatLngFloor to = new IALatLngFloor(
                  _to.getDouble("latitude"),
                  _to.getDouble("longitude"),
                  _to.getInt("floor"));
              requestWayfindingRoute(from, to, callbackContext);
            } else if ("removeWayfindingUpdates".equals(action)) {
              removeWayfindingUpdates();
            } else  if ("watchGeofences".equals(action)) {
                watchGeofences(callbackContext);
            } else  if ("clearGeofenceWatch".equals(action)) {
                clearGeofenceWatch();
            } else if ("addDynamicGeofence".equals(action)) {
                JSONObject geofence = args.getJSONObject(0);
                addDynamicGeofence(geofence);
            } else if ("removeDynamicGeofence".equals(action)) {
                JSONObject geofence = args.getJSONObject(0);
                removeDynamicGeofence(geofence);
            } else if ("lockFloor".equals(action)) {
              int floorNumber = args.getInt(0);
              lockFloor(floorNumber);
            } else if ("unlockFloor".equals(action)) {
              unlockFloor();
            } else if ("lockIndoors".equals(action)) {
              boolean locked = args.getBoolean(0);
              lockIndoors(locked);
            } else if ("watchIBeacons".equals(action)) {
              watchIBeacons(callbackContext);
            } else if ("clearIBeaconWatch".equals(action)) {
              clearIBeaconWatch();
            } else if ("watchWifis".equals(action)) {
              watchWifis(callbackContext);
            } else if ("clearWifiWatch".equals(action)) {
              clearWifiWatch();
            }
        }
        catch(Exception ex) {
            Log.e(TAG,ex.toString());
            callbackContext.error(PositionError.getErrorObject(PositionError.UNSPECIFIED_ERROR,ex.toString()));
            return false;
        }
        return true;
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    @Override
    public void onDestroy() {
        if (mLocationManager != null){
            mLocationManager.destroy();
        }
        super.onDestroy();
    }

    /**
     * Gets last known saved position from IndoorLocationListener
     * @param callbackContext
     */
    private void getLastKnownLocation(CallbackContext callbackContext)throws JSONException {
        JSONObject locationData;
        if (mListener != null) {
            locationData = mListener.getLastKnownLocation();
            if (locationData != null) {
                callbackContext.success(locationData);
            }
            else {
                callbackContext.error(PositionError.getErrorObject(PositionError.POSITION_UNAVAILABLE));
            }
        }
        else {
            callbackContext.error(PositionError.getErrorObject(PositionError.POSITION_UNAVAILABLE));
        }
    }

    /**
     * Initialized location manger with given key and secret
     * @param apiKey
     * @param apiSecret
     */
    private void initializeIndoorAtlas(final String apiKey, final String apiSecret, final String pluginVersion, final CallbackContext callbackContext) {
        if (mLocationManager == null){
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Bundle bundle = new Bundle(2);
                    bundle.putString(IALocationManager.EXTRA_API_KEY, apiKey);
                    bundle.putString(IALocationManager.EXTRA_API_SECRET, apiSecret);
                    // react.native
                    bundle.putString("com.indooratlas.android.sdk.intent.extras.wrapperName", "react-native");
                    if (pluginVersion != null) {
                        bundle.putString("com.indooratlas.android.sdk.intent.extras.wrapperVersion", pluginVersion);
                    }
                    mLocationManager = IALocationManager.create(cordova.getActivity().getApplicationContext(), bundle);
                    callbackContext.success();
                }
            });
        }
    }

    /**
     * Adds a new callback to the IndoorAtlas location listener
     * @param watchId
     * @param callbackContext
     */
    private void addWatch(String watchId, CallbackContext callbackContext) {
        getListener(this).addWatch(watchId, callbackContext);
    }

    /**
     * Adds a new callback to the IndoorAtlas IARegion.Listener
     */
    private void addRegionWatch(String watchId, CallbackContext callbackContext) {
        getListener(this).addRegionWatch(watchId, callbackContext);
    }

    /**
     * Adds a new callback to the IndoorAtlas IAAttitude.Listener
     */
    private void addAttitudeCallback(CallbackContext callbackContext) {
      getListener(this).addAttitudeCallback(callbackContext);
    }

    /**
     * Adds a new callback to the IndoorAtlas IAAttitude.Listener
     */
    private void addHeadingCallback(CallbackContext callbackContext) {
      getListener(this).addHeadingCallback(callbackContext);
    }

    /**
     * Adds a new callback to the IndoorAtlas IAAttitude.Listener
     */
    private void addStatusChangedCallback(CallbackContext callbackContext) {
      getListener(this).addStatusChangedCallback(callbackContext);
    }

    /**
     * Removes callback from IndoorAtlas location listener
     * @param watchId
     */
    private void clearWatch(String watchId) {
        getListener(this).clearWatch(watchId);
    }

    /**
     * Removes callback from IndoorAtlas IARegion.Listener
     * @param watchId
     */
    private void clearRegionWatch(String watchId) {
        getListener(this).clearRegionWatch(watchId);
    }

    /**
     * Removes callback from IndoorAtlas location listener
     */
    private void removeAttitudeCallback() {
      getListener(this).removeAttitudeCallback();
    }

    /**
     * Removes callback from IndoorAtlas location listener
     */
     private void removeHeadingCallback() {
       getListener(this).removeHeadingCallback();
     }

     /**
      * Removes callback from IndoorAtlas location listener
      */
     private void removeStatusCallback() {
       getListener(this).removeStatusCallback();
     }

    /**
     * Compute route for the given values;
     * 1) Set location of the wayfinder instance
     * 2) Set destination of the wayfinder instance
     * 3) Get route between the given location and destination
     */
    private void requestWayfindingUpdates(Double lat, Double lon, int floor, CallbackContext callbackContext) {
        getListener(this).requestWayfindingUpdates(callbackContext);
        final IAWayfindingRequest wayfindingRequest = new IAWayfindingRequest.Builder()
            .withLatitude(lat)
            .withLongitude(lon)
            .withFloor(floor)
            .build();

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
              mLocationManager.requestWayfindingUpdates(wayfindingRequest, getListener(IALocationPlugin.this));
            }
        });
    }

    private void removeWayfindingUpdates() {
        getListener(this).removeWayfindingUpdates();
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
              mLocationManager.removeWayfindingUpdates();
            }
        });
    }

    private void requestWayfindingRoute(
        final IALatLngFloorCompatible from,
        final IALatLngFloorCompatible to,
        final CallbackContext callbackContext
    ) {
        final IAWayfindingListener listener = new IAWayfindingListener() {
            @Override
            public void onWayfindingUpdate(IARoute route) {
                PluginResult pluginResult;
                pluginResult = new PluginResult(PluginResult.Status.OK, getRouteJSONFromIARoute(route));
                //pluginResult.setKeepCallback(false);
                callbackContext.sendPluginResult(pluginResult);
            }
        };
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.requestWayfindingRoute(from, to, listener);
            }
        });
    }

    private IAGeofence geofenceFromJsonObject(JSONObject geoJson) {
        try {
            List<double[]> iaEdges = new ArrayList<>();
            JSONObject geometry = geoJson.getJSONObject("geometry");
            JSONObject properties = geoJson.getJSONObject("properties");
            JSONArray coordinates = geometry.getJSONArray("coordinates");
            JSONArray linearRing = coordinates.getJSONArray(0);
            for (int i = 0; i < linearRing.length(); i++) {
                JSONArray vertex = linearRing.getJSONArray(i);
                iaEdges.add(new double[] {vertex.getDouble(1), vertex.getDouble(0)});
            }
            JSONObject payload = new JSONObject();
            if (properties.has("payload")) {
                payload = properties.getJSONObject("payload");
            }
            IAGeofence iaGeofence = new IAGeofence.Builder()
                .withId(geoJson.getString("id"))
                .withName(properties.getString("name"))
                .withFloor(properties.getInt("floor"))
                .withPayload(payload)
                .withEdges(iaEdges)
                .build();
            return iaGeofence;
        } catch (JSONException e) {
            Log.e(TAG, "error reading geofence geojson: " + e.getMessage());
            throw new IllegalStateException(e.getMessage());
        }
    }

    private void watchGeofences(CallbackContext callbackContext) {
        getListener(this).addGeofences(callbackContext);
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.addGeofences(
                    new IAGeofenceRequest.Builder()
                        .withCloudGeofences(true)
                        .build(),
                    getListener(IALocationPlugin.this)
                );
            }
        });
    }

    private void clearGeofenceWatch() {
        getListener(this).removeGeofenceUpdates();
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.removeGeofenceUpdates(getListener(IALocationPlugin.this));
            }
        });
    }

    private void addDynamicGeofence(JSONObject geoJson) {
        final IAGeofence iaGeofence = geofenceFromJsonObject(geoJson);
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.addGeofences(
                    new IAGeofenceRequest.Builder()
                        .withGeofence(iaGeofence)
                        .withCloudGeofences(true)
                        .build(),
                    getListener(IALocationPlugin.this)
                );
            }
        });
    }

    private void removeDynamicGeofence(JSONObject geoJson) {
        final List<String> geofenceIds = new ArrayList<>();
        try {
            geofenceIds.add(geoJson.getString("id"));
        } catch (JSONException e) {
           throw new IllegalStateException(e.getMessage());
        }
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.removeGeofences(geofenceIds);
            }
        });
    }

    private void lockFloor(final int floorNumber) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
              mLocationManager.lockFloor(floorNumber);
            }
        });
    }

    private void unlockFloor() {
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
              mLocationManager.unlockFloor();
            }
        });
    }

    private void lockIndoors(final boolean locked) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
              mLocationManager.lockIndoors(locked);
            }
        });
    }

    /**
     * Set sensitivities for orientation and heading filter
     */
     private void setSensitivities(double orientationSensitivity, double headingSensitivity, CallbackContext callbackContext) {
       mOrientationRequest = new IAOrientationRequest(headingSensitivity, orientationSensitivity);
       cordova.getActivity().runOnUiThread(new Runnable() {
           @Override
           public void run() {
             mLocationManager.unregisterOrientationListener(getListener(IALocationPlugin.this));
             mLocationManager.registerOrientationListener(mOrientationRequest, getListener(IALocationPlugin.this));
           }
       });

       JSONObject successObject = new JSONObject();
       try {
           successObject.put("message","Sensitivies set");
       } catch (JSONException ex) {
           throw new IllegalStateException(ex.getMessage());
       }
       callbackContext.success(successObject);
     }

    /**
     * Validates parameters passed by user before initializing IALocationManager
     * @param args
     * @return
     * @throws JSONException
     */
    private boolean validateIAKeys(JSONArray args) throws JSONException {
        String apiKey = args.getString(0);
        String apiSecret = args.getString(1);
        if (apiKey.trim().equalsIgnoreCase("")) {
            return false;
        }
        if (apiSecret.trim().equalsIgnoreCase("")) {
            return false;
        }
        return true;
    }

    /**
     * Set explicit position of IALocationManager using either a region or geo-coordinates
     * @param args
     * @param callbackContext
     * @throws Exception
     */
    private void setPosition(final JSONArray args,final CallbackContext callbackContext) throws Exception {
        final IALocation.Builder builder;
        if (mLocationManager != null) {
            double lat = args.getDouble(0);
            double lon = args.getDouble(1);
            builder = new IALocation.Builder()
                .withLatitude(lat)
                .withLongitude(lon);
            if (!args.isNull(2)) {
                int floor = args.getInt(2);
                builder.withFloorLevel(floor);
            }
            if (!args.isNull(3)) {
                double acc = args.getDouble(3);
                builder.withAccuracy((float)acc);
            }

            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    IALocation iaLocation;
                    iaLocation = builder.build();
                    mLocationManager.setLocation(iaLocation);
                    JSONObject successObject = new JSONObject();
                    try {
                        successObject.put("message","Position set");
                    } catch (JSONException ex) {
                        Log.e(TAG, ex.toString());
                        throw new IllegalStateException(ex.getMessage());
                    }
                    callbackContext.success(successObject);
                }
            });
        }
        else {
            callbackContext.error(PositionError.getErrorObject(PositionError.INITIALIZATION_ERROR));
        }
    }

    private void watchIBeacons(CallbackContext callbackContext) {
        final IARadioScanRequest req = (mRadioScanRequest != null && mRadioScanRequest.wifis) ?
            mRadioScanRequest.andIBeacons() : IARadioScanRequest.withIBeacons();
        mRadioScanRequest = req;
        getListener(this).addIBeaconWatch(callbackContext);
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.requestRadioScanUpdates(
                    req,
                    getListener(IALocationPlugin.this)
                );
            }
        });
    }

    private void clearIBeaconWatch() {
        final IARadioScanRequest req = (mRadioScanRequest != null && mRadioScanRequest.wifis) ?
            IARadioScanRequest.withWifis() : null;
        mRadioScanRequest = req;
        getListener(this).clearIBeaconWatch();
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (req == null) {
                    mLocationManager.removeRadioScanUpdates();
                } else {
                    mLocationManager.requestRadioScanUpdates(
                        req,
                        getListener(IALocationPlugin.this)
                    );
                }
            }
        });
    }

    private void watchWifis(CallbackContext callbackContext) {
        final IARadioScanRequest req = (mRadioScanRequest != null && mRadioScanRequest.iBeacons) ?
            mRadioScanRequest.andWifis() : IARadioScanRequest.withWifis();
        mRadioScanRequest = req;
        getListener(this).addWifiWatch(callbackContext);
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.requestRadioScanUpdates(
                    req,
                    getListener(IALocationPlugin.this)
                );
            }
        });
    }

    private void clearWifiWatch() {
        final IARadioScanRequest req = (mRadioScanRequest != null && mRadioScanRequest.iBeacons) ?
            IARadioScanRequest.withIBeacons() : null;
        mRadioScanRequest = req;
        getListener(this).clearWifiWatch();
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (req == null) {
                    mLocationManager.removeRadioScanUpdates();
                } else {
                    mLocationManager.requestRadioScanUpdates(
                        req,
                        getListener(IALocationPlugin.this)
                    );
                }
            }
        });
    }

    /**
     * Starts IndoorAtlas positioning session
     * @param callbackContext
     */
    protected void startPositioning(CallbackContext callbackContext) {
        if (mLocationManager != null) {
            startPositioning();
        }
        else {
            callbackContext.error(PositionError.getErrorObject(PositionError.INITIALIZATION_ERROR));
        }
    }
    
    private void setPositioningMode(String mode, CallbackContext callbackContext) {
      int priority;
      switch (mode) {
        case "HIGH_ACCURACY": priority = IALocationRequest.PRIORITY_HIGH_ACCURACY; break;
        case "LOW_POWER": priority = IALocationRequest.PRIORITY_LOW_POWER; break;
        case "CART": priority = IALocationRequest.PRIORITY_CART_MODE; break;
        default:
          callbackContext.error(PositionError.getErrorObject(PositionError.INVALID_POSITIONING_MODE));
          return;
      }
      mLocationRequest.setPriority(priority);
    }

    private void setOutputThresholds(float distance, float interval, CallbackContext callbackContext) {
        if (distance < 0 || interval < 0) {
            callbackContext.error(PositionError.getErrorObject(PositionError.INVALID_OUTPUT_THRESHOLD_VALUE));
            return;
        }
        final boolean wasRunning = mLocationServiceRunning;
        if (wasRunning) stopPositioning();
        if (distance >= 0) {
            mLocationRequest.setSmallestDisplacement(distance);
        }
        if (interval >= 0) {
            // convert to milliseconds
            mLocationRequest.setFastestInterval((long)(interval * 1000));
        }
        JSONObject successObject = new JSONObject();
        try {
            successObject.put("message","Output thresholds set");
        } catch (JSONException ex) {
            Log.e(TAG, ex.toString());
            throw new IllegalStateException(ex.getMessage());
        }
        callbackContext.success(successObject);
        if (wasRunning) startPositioning();
    }

    private void getTraceId(CallbackContext callbackContext) {
      JSONObject data;
      data = new JSONObject();
      try {
          data.put("traceId", mLocationManager.getExtraInfo().traceId);
      } catch (JSONException ex) {
          Log.e(TAG, ex.toString());
          throw new IllegalStateException(ex.getMessage());
      }
      callbackContext.success(data);
    }

    private void getFloorCertainty(CallbackContext callbackContext) {

      if (mListener != null) {
        if(mListener.lastKnownLocation != null) {
          if (mListener.lastKnownLocation.hasFloorCertainty()) {
            JSONObject data;
            data = new JSONObject();
            try {
              data.put("floorCertainty", mListener.lastKnownLocation.getFloorCertainty());

            } catch (JSONException ex) {
              Log.e(TAG, ex.toString());
              throw new IllegalStateException(ex.getMessage());
            }
            callbackContext.success(data);
          }
        } else {
          callbackContext.error("No floor certainty");
        }
      } else {
        callbackContext.error("No floor certainty");
      }
    }

    /**
     * Starts IndoorAtlas positioning session
     */
    protected void startPositioning() {
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mLocationManager.requestLocationUpdates(mLocationRequest, getListener(IALocationPlugin.this));
                mLocationManager.registerRegionListener(getListener(IALocationPlugin.this));
                mLocationManager.registerOrientationListener(mOrientationRequest, getListener(IALocationPlugin.this));
                mLocationServiceRunning = true;
            }
        });
    }

    /**
     * Stops IndoorAtlas positioning session
     */
    protected void stopPositioning() {
        if (mLocationManager != null) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mLocationManager.unregisterRegionListener(getListener(IALocationPlugin.this));
                    mLocationManager.removeLocationUpdates(getListener(IALocationPlugin.this));
                    mLocationManager.unregisterOrientationListener(getListener(IALocationPlugin.this));
                    mLocationServiceRunning = false;
                }
            });
        }
    }

    /**
     * Checks if application manifest contains IndoorAtlas key and secret(NOT BEING USED).
     * @return
     * @throws PackageManager.NameNotFoundException
     */
    private boolean isValidManifest()throws PackageManager.NameNotFoundException {
        Bundle bundle;
        bundle = cordova.getActivity().getPackageManager().getApplicationInfo(cordova.getActivity().getPackageName(), PackageManager.GET_META_DATA).metaData;
        if (!bundle.containsKey("com.indooratlas.android.sdk.API_KEY")) {
            return false;
        }
        if (!bundle.containsKey("com.indooratlas.android.sdk.API_SECRET")) {
            return false;
        }
        return true;
    }

    /**
     * Returns IndoorLocationListener class object
     * @param plugin
     * @return
     */
    private IndoorLocationListener getListener(IALocationPlugin plugin) {
        if (mListener == null){
            mListener = new IndoorLocationListener(plugin);
        }
        return mListener;
    }

    // react.native
    public IALocationPlugin(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "IndoorAtlas";
    }
    
    @ReactMethod
    public void initializeIndoorAtlas(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("initializeIndoorAtlas", args, success, error);
    }

    @ReactMethod
    public void addWatch(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("addWatch", args, success, error);
    }

    @ReactMethod
    public void clearWatch(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("clearWatch", args, success, error);
    }

    @ReactMethod
    public void getLocation(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("getLocation", args, success, error);
    }

    @ReactMethod
    public void getPermissions(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("getPermissions", args, success, error);
    }

    @ReactMethod
    public void setPosition(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("setPosition", args, success, error);
    }

    @ReactMethod
    public void addRegionWatch(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("addRegionWatch", args, success, error);
    }

    @ReactMethod
    public void clearRegionWatch(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("clearRegionWatch", args, success, error);
    }

    @ReactMethod
    public void setOutputThresholds(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("setOutputThresholds", args, success, error);
    }

    @ReactMethod
    public void setPositioningMode(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("setPositioningMode", args, success, error);
    }

    @ReactMethod
    public void getTraceId(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("getTraceId", args, success, error);
    }

    @ReactMethod
    public void getFloorCertainty(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("getFloorCertainty", args, success, error);
    }

    @ReactMethod
    public void addAttitudeCallback(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("addAttitudeCallback", args, success, error);
    }

    @ReactMethod
    public void removeAttitudeCallback(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("removeAttitudeCallback", args, success, error);
    }

    @ReactMethod
    public void addHeadingCallback(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("addHeadingCallback", args, success, error);
    }

    @ReactMethod
    public void removeHeadingCallback(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("removeHeadingCallback", args, success, error);
    }

    @ReactMethod
    public void setSensitivities(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("setSensitivities", args, success, error);
    }

    @ReactMethod
    public void addStatusChangedCallback(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("addStatusChangedCallback", args, success, error);
    }

    @ReactMethod
    public void removeStatusCallback(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("removeStatusCallback", args, success, error);
    }

    @ReactMethod
    public void requestWayfindingUpdates(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("requestWayfindingUpdates", args, success, error);
    }

    @ReactMethod
    public void requestWayfindingRoute(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("requestWayfindingRoute", args, success, error);
    }

    @ReactMethod
    public void removeWayfindingUpdates(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("removeWayfindingUpdates", args, success, error);
    }

    @ReactMethod
    public void watchGeofences(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("watchGeofences", args, success, error);
    }

    @ReactMethod
    public void clearGeofenceWatch(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("clearGeofenceWatch", args, success, error);
    }

    @ReactMethod
    public void addDynamicGeofence(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("addDynamicGeofence", args, success, error);
    }

    @ReactMethod
    public void removeDynamicGeofence(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("removeDynamicGeofence", args, success, error);
    }

    @ReactMethod
    public void lockFloor(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("lockFloor", args, success, error);
    }

    @ReactMethod
    public void unlockFloor(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("unlockFloor", args, success, error);
    }

    @ReactMethod
    public void lockIndoors(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("lockIndoors", args, success, error);
    }

    @ReactMethod
    public void watchIBeacons(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("watchIBeacons", args, success, error);
    }

    @ReactMethod
    public void clearIBeaconWatch(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("clearIBeaconWatch", args, success, error);
    }

    @ReactMethod
    public void watchWifis(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("watchWifis", args, success, error);
    }

    @ReactMethod
    public void clearWifiWatch(ReadableArray args, Callback success, Callback error) {
        executeReactMethod("clearWifiWatch", args, success, error);
    }
}
