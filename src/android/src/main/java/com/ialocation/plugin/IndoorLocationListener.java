package com.ialocation.plugin;

import android.os.Bundle;
import android.util.Log;

import com.indooratlas.android.sdk.IALocation;
import com.indooratlas.android.sdk.IALocationListener;
import com.indooratlas.android.sdk.IALocationManager;
import com.indooratlas.android.sdk.IARegion;
import com.indooratlas.android.sdk.IARoute;
import com.indooratlas.android.sdk.IAOrientationListener;
import com.indooratlas.android.sdk.IARadioScanListener;
import com.indooratlas.android.sdk.IAWayfindingListener;
import com.indooratlas.android.sdk.IAGeofence;
import com.indooratlas.android.sdk.IAGeofenceEvent;
import com.indooratlas.android.sdk.IAGeofenceListener;
import com.indooratlas.android.sdk.IAPOI;
import com.indooratlas.android.sdk.resources.IAFloorPlan;
import com.indooratlas.android.sdk.resources.IALatLng;
import com.indooratlas.android.sdk.resources.IARadioScan;
import com.indooratlas.android.sdk.resources.IAVenue;
// react.native
import com.remobile.cordova.PluginResult;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Handles events from IALocationListener and IARegion.Listener and relays them to Javascript callbacks.
 */
public class IndoorLocationListener extends IARadioScanListener implements IALocationListener, IARegion.Listener, IAOrientationListener,
        IAWayfindingListener, IAGeofenceListener {
    private static final String TAG = "IndoorLocationListener";

    private static final int TRANSITION_TYPE_UNKNOWN = 0;
    private static final int TRANSITION_TYPE_ENTER = 1;
    private static final int TRANSITION_TYPE_EXIT = 2;

    private HashMap<String, CallbackContext> watches = new HashMap<String, CallbackContext>();
    private HashMap<String, CallbackContext> regionWatches = new HashMap<String, CallbackContext>();
    private CallbackContext attitudeUpdateCallbackContext;
    private CallbackContext statusUpdateCallbackContext;
    private CallbackContext wayfindingUpdateCallbackContext;
    private CallbackContext geofenceCallbackContext;
    private CallbackContext iBeaconScanCallbackContext;
    private CallbackContext wifiScanCallbackContext;
    private ArrayList<CallbackContext> mCallbacks = new ArrayList<CallbackContext>();
    private CallbackContext mCallbackContext;
    public IALocation lastKnownLocation = null;
    private IALocationPlugin owner;

    /**
     * The constructor
     * @param iaLocationPlugin
     */
    public IndoorLocationListener(IALocationPlugin iaLocationPlugin) {
        this.owner = iaLocationPlugin;
    }

    /**
     * Returns watchPosition callback collection.
     * @return
     */
    public HashMap<String, CallbackContext> getWatches() {
        return watches;
    }

    /**
     * Returns getCurrentPosition callback collection
     * @return
     */
    public ArrayList<CallbackContext> getCallbacks() {
        return mCallbacks;
    }

    /**
     * Returns a JSON object the last known user position
     * @return
     */
    public JSONObject getLastKnownLocation() {
        if (lastKnownLocation != null) {
            JSONObject locationData = getLocationJSONFromIALocation(lastKnownLocation);
            return locationData;
        }
        return null;
    }

    /**
     * Adds watchPosition JS callback to the collection
     * @param watchId
     * @param callbackContext
     */
    public void addWatch(String watchId, CallbackContext callbackContext) {
        watches.put(watchId, callbackContext);
    }

    /**
     * Adds watchRegion JS callback to the collection
     * @param watchId
     * @param callbackContext
     */
    public void addRegionWatch(String watchId, CallbackContext callbackContext) {
        regionWatches.put(watchId, callbackContext);
    }

    /**
     * Adds attitudeWatch JS callback to the collection
     * @param callbackContext
     */
    public void addAttitudeCallback(CallbackContext callbackContext) {
      attitudeUpdateCallbackContext = callbackContext;
    }

    /**
     * Adds getCurrentPosition JS callback to the collection
     * @param callbackContext
     */
    public void addCallback(CallbackContext callbackContext) {
        mCallbacks.add(callbackContext);
    }

    /**
     * Adds statusChanged JS callback to the collection
     * @param callbackContext
     */
    public void addStatusChangedCallback(CallbackContext callbackContext) {
      statusUpdateCallbackContext = callbackContext;
    }

    public void requestWayfindingUpdates(CallbackContext callbackContext) {
      wayfindingUpdateCallbackContext = callbackContext;
    }

    public void addGeofences(CallbackContext callbackContext) {
        geofenceCallbackContext = callbackContext;
    }

    public void removeGeofenceUpdates() {
        geofenceCallbackContext = null;
    }

    public void addIBeaconWatch(CallbackContext callbackContext) {
        iBeaconScanCallbackContext = callbackContext;
    }

    public void clearIBeaconWatch() {
        iBeaconScanCallbackContext = null;
    }

    public void addWifiWatch(CallbackContext callbackContext) {
        wifiScanCallbackContext = callbackContext;
    }

    public void clearWifiWatch() {
        wifiScanCallbackContext = null;
    }

    /**
     * Returns the sum of the all callback collections
     * @return
     */
    public int size() {
        return watches.size() + mCallbacks.size() + regionWatches.size();
    }

    /**
     * Removes a callback from watchPosition callback collection
     * @param watchId
     */
    public void clearWatch(String watchId) {
        if (watches.containsKey(watchId)) {
            watches.remove(watchId);
        }
        if (size() == 0) {
            owner.stopPositioning();
        }
    }

    /**
     * Removes a callback from watchRegion callback collection
     * @param watchId
     */
    public void clearRegionWatch(String watchId) {
        if (regionWatches.containsKey(watchId)) {
            regionWatches.remove(watchId);
        }
        if (size() == 0){
            owner.stopPositioning();
        }
    }

    public void removeWayfindingUpdates() {
      wayfindingUpdateCallbackContext = null;
    }

    /**
     * Removes attitude callback
     */
    public void removeAttitudeCallback() {
      attitudeUpdateCallbackContext = null;
    }

     /**
      * Removes status callback
      */
      public void removeStatusCallback() {
        statusUpdateCallbackContext = null;
      }


    private JSONObject getFloorPlanJSONFromIAFloorPlan(IAFloorPlan floorPlan) {
      JSONObject floorplanInfo = new JSONObject();
      try {
        floorplanInfo.put("id", floorPlan.getId());
        floorplanInfo.put("name", floorPlan.getName());
        floorplanInfo.put("url", floorPlan.getUrl());
        floorplanInfo.put("floorLevel", floorPlan.getFloorLevel());
        floorplanInfo.put("bearing", floorPlan.getBearing());
        floorplanInfo.put("bitmapHeight", floorPlan.getBitmapHeight());
        floorplanInfo.put("bitmapWidth", floorPlan.getBitmapWidth());
        floorplanInfo.put("heightMeters", floorPlan.getHeightMeters());
        floorplanInfo.put("widthMeters", floorPlan.getWidthMeters());
        floorplanInfo.put("metersToPixels", floorPlan.getMetersToPixels());
        floorplanInfo.put("pixelsToMeters", floorPlan.getPixelsToMeters());

        JSONArray latlngArray = new JSONArray();
        IALatLng iaLatLng = floorPlan.getBottomLeft();
        latlngArray.put(iaLatLng.longitude);
        latlngArray.put(iaLatLng.latitude);
        floorplanInfo.put("bottomLeft", latlngArray);

        latlngArray = new JSONArray();
        iaLatLng = floorPlan.getBottomRight();
        latlngArray.put(iaLatLng.longitude);
        latlngArray.put(iaLatLng.latitude);
        floorplanInfo.put("bottomRight", latlngArray);

        latlngArray = new JSONArray();
        iaLatLng = floorPlan.getCenter();
        latlngArray.put(iaLatLng.longitude);
        latlngArray.put(iaLatLng.latitude);
        floorplanInfo.put("center", latlngArray);

        latlngArray = new JSONArray();
        iaLatLng = floorPlan.getTopLeft();
        latlngArray.put(iaLatLng.longitude);
        latlngArray.put(iaLatLng.latitude);
        floorplanInfo.put("topLeft", latlngArray);

        latlngArray = new JSONArray();
        iaLatLng = floorPlan.getTopRight();
        latlngArray.put(iaLatLng.longitude);
        latlngArray.put(iaLatLng.latitude);
        floorplanInfo.put("topRight", latlngArray);
      } catch(JSONException ex) {
          Log.e(TAG, ex.toString());
          throw new IllegalStateException(ex.getMessage());
      }

      return floorplanInfo;
    }

    /**
     * Returns a JSON object which contains IARegion info.
     * @param iaRegion
     * @param transitionType
     * @return
     */
    private JSONObject getRegionJSONFromIARegion(IARegion iaRegion, int transitionType) {
        try {
            JSONObject regionData = new JSONObject();
            regionData.put("regionId", iaRegion.getId());
            regionData.put("timestamp", iaRegion.getTimestamp());
            regionData.put("regionType", iaRegion.getType());
            regionData.put("transitionType", transitionType);

            IAFloorPlan floorPlan = iaRegion.getFloorPlan();
            if (floorPlan != null) {
              regionData.put("floorPlan", getFloorPlanJSONFromIAFloorPlan(floorPlan));
            }

            IAVenue venue = iaRegion.getVenue();
            if (venue != null) {
              JSONObject venueData = new JSONObject();
              venueData.put("id", venue.getId());
              venueData.put("name", venue.getName());
              JSONArray venueFloorPlans = new JSONArray();
              for (IAFloorPlan venueFloorPlan : venue.getFloorPlans()) {
                venueFloorPlans.put(getFloorPlanJSONFromIAFloorPlan(venueFloorPlan));
              }
              venueData.put("floorPlans", venueFloorPlans);
              JSONArray venueGeofences = new JSONArray();
              for (IAGeofence geofence : venue.getGeofences()) {
                venueGeofences.put(getGeojsonFromIaGeofence(geofence));
              }
              venueData.put("geofences", venueGeofences);
              JSONArray venuePois = new JSONArray();
              for (IAPOI poi : venue.getPOIs()) {
                venuePois.put(getPoiJsonFromIaPoi(poi));
              }
              venueData.put("pois", venuePois);
              regionData.put("venue", venueData);
            }

            return regionData;
        }
        catch(JSONException ex) {
            Log.e(TAG, ex.toString());
            throw new IllegalStateException(ex.getMessage());
        }
    }

    /**
     * Returns a JSON object which contains IALocation info.
     * @param iaLocation
     * @return
     */
    private JSONObject getLocationJSONFromIALocation(IALocation iaLocation) {
        try {
            JSONObject locationData,regionData;
            locationData = new JSONObject();
            locationData.put("accuracy", iaLocation.getAccuracy());
            locationData.put("altitude", iaLocation.getAltitude());
            locationData.put("heading", iaLocation.getBearing());
            locationData.put("floorCertainty", iaLocation.getFloorCertainty());
            locationData.put("flr", iaLocation.getFloorLevel());
            locationData.put("latitude", iaLocation.getLatitude());
            locationData.put("longitude", iaLocation.getLongitude());
            if (iaLocation.getRegion() != null) {
                regionData = getRegionJSONFromIARegion(iaLocation.getRegion(), TRANSITION_TYPE_UNKNOWN);
                locationData.put("region", regionData);
            }
            locationData.put("velocity",iaLocation.toLocation().getSpeed());
            locationData.put("timestamp",iaLocation.getTime());
            return locationData;
        }
        catch(JSONException ex) {
            Log.e(TAG, ex.toString());
            throw new IllegalStateException(ex.getMessage());
        }
    }

    static JSONObject getRouteJSONFromIARoute(IARoute route) {
      JSONObject obj = new JSONObject();
      try {
        JSONArray jsonArray = new JSONArray();
        for (IARoute.Leg leg : route.getLegs()) {
            jsonArray.put(jsonObjectFromRoutingLeg(leg));
        }
        obj.put("legs", jsonArray);
        obj.put("error", route.getError().name());
      } catch(JSONException e) {
          Log.e("IAWAYFINDER", "json error with route");
      }
      return obj;
    }

    /**
     * Create JSON object from the given RoutingLeg object
     */
    private static JSONObject jsonObjectFromRoutingLeg(IARoute.Leg routingLeg) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("begin", jsonObjectFromRoutingPoint(routingLeg.getBegin()));
            obj.put("end", jsonObjectFromRoutingPoint(routingLeg.getEnd()));
            obj.put("length", routingLeg.getLength());
            obj.put("direction", routingLeg.getDirection());
            obj.put("edgeIndex", routingLeg.getEdgeIndex());
        } catch(JSONException e) {

        }
        return obj;
    }

    /**
     * Create JSON object from RoutingPoint object
     */
    private static JSONObject jsonObjectFromRoutingPoint(IARoute.Point routingPoint) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("latitude", routingPoint.getLatitude());
            obj.put("longitude", routingPoint.getLongitude());
            obj.put("floor", routingPoint.getFloor());
        } catch(JSONException e) {

        }
        return obj;
    }

    /**
     * Called when the location has changed.
     * @param iaLocation
     */
    @Override
    public void onLocationChanged(IALocation iaLocation) {
        JSONObject locationData;
        Log.w(TAG, "Got location");
        locationData = getLocationJSONFromIALocation(iaLocation);
        lastKnownLocation = iaLocation;
        sendResult(locationData);
    }

    /**
     * Called to report that user has entered a new region.
     * @param iaRegion
     */
    @Override
    public void onEnterRegion(IARegion iaRegion) {
        JSONObject regionData = getRegionJSONFromIARegion(iaRegion, TRANSITION_TYPE_ENTER);
        sendRegionResult(regionData);
    }

    /**
     * Called to report that user has exited a region.
     * @param iaRegion
     */
    @Override
    public void onExitRegion(IARegion iaRegion) {
        JSONObject regionData = getRegionJSONFromIARegion(iaRegion, TRANSITION_TYPE_EXIT);
        sendRegionResult(regionData);
    }

    /**
     * Called to report that orientation has changed
     * @param timestamp
     * @param quaternion
     */
    @Override
    public void onOrientationChange(long timestamp, double[] quaternion) {
      try {
          JSONObject orientationData;
          orientationData = new JSONObject();
          orientationData.put("timestamp", timestamp);
          orientationData.put("x", quaternion[1]);
          orientationData.put("y", quaternion[2]);
          orientationData.put("z", quaternion[3]);
          orientationData.put("w", quaternion[0]);

          sendOrientationResult(orientationData);
      }
      catch(JSONException ex) {
          Log.e(TAG, ex.toString());
          throw new IllegalStateException(ex.getMessage());
      }
    }

    /**
     * Called to report that heading has changed
     * @param timestamp
     * @param heading
     */
    @Override
    public void onHeadingChanged(long timestamp, double heading) {
        // not used
    }

    /**
     * Invokes JS callback from watchOrientation callback collection.
     * @param orientationData
     */
     private void sendOrientationResult(JSONObject orientationData) {
       if (attitudeUpdateCallbackContext != null) {
         PluginResult pluginResult;
         pluginResult = new PluginResult(PluginResult.Status.OK, orientationData);
         //pluginResult.setKeepCallback(true);
         attitudeUpdateCallbackContext.sendPluginResult(pluginResult);
       }
     }

    /**
     * Invokes JS callback from watchRegion callback collection.
     * @param regionData
     */
    private void sendRegionResult(JSONObject regionData) {
        PluginResult pluginResult;
        for (CallbackContext callbackContext : regionWatches.values()) {
            pluginResult = new PluginResult(PluginResult.Status.OK, regionData);
            //pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
    }

    /**
     * Invokes JS callback from watchPosition callback collection.
     * @param locationData
     */
    private void sendResult(JSONObject locationData) {
        PluginResult pluginResult;
        for (CallbackContext callbackContext : mCallbacks) {
            pluginResult = new PluginResult(PluginResult.Status.OK, locationData);
            //pluginResult.setKeepCallback(false);
            callbackContext.sendPluginResult(pluginResult);
        }

        for (CallbackContext callbackContext : watches.values()) {
            pluginResult = new PluginResult(PluginResult.Status.OK, locationData);
            //pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
        mCallbacks.clear();
        if (size() == 0) {
            owner.stopPositioning();
        }
    }

    /**
     * Invokes JS callback from statusChanged callback.
     * @param statusData
     */
    private void sendStatusResult(JSONObject statusData) {
      if (statusUpdateCallbackContext != null) {
        PluginResult pluginResult;
        pluginResult = new PluginResult(PluginResult.Status.OK, statusData);
        //pluginResult.setKeepCallback(true);
        statusUpdateCallbackContext.sendPluginResult(pluginResult);
      }
    }

    /**
     * Notifies JS callbacks about service interuption
     */
    private void handleServiceInteruption() {
        PluginResult pluginResult;
        for (CallbackContext callbackContext : watches.values()) {
            pluginResult = new PluginResult(PluginResult.Status.ERROR, PositionError.getErrorObject(PositionError.POSITION_UNAVAILABLE));
            //pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
        for (CallbackContext callbackContext : regionWatches.values()) {
            pluginResult = new PluginResult(PluginResult.Status.ERROR, PositionError.getErrorObject(PositionError.POSITION_UNAVAILABLE));
            //pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
    }

    /**
     * Called when provider status changes.
     * @param provider
     * @param status
     * @param bundle
     */
    @Override
    public void onStatusChanged(String provider, int status, Bundle bundle) {
        JSONObject statusData;
        statusData = new JSONObject();
        switch (status) {
          case IALocationManager.STATUS_AVAILABLE:
              statusData = CurrentStatus.getStatusObject(CurrentStatus.STATUS_AVAILABLE);
              sendStatusResult(statusData);
              break;
          case IALocationManager.STATUS_LIMITED:
              statusData = CurrentStatus.getStatusObject(CurrentStatus.STATUS_LIMITED);
              sendStatusResult(statusData);
              break;
          case IALocationManager.STATUS_OUT_OF_SERVICE:
              statusData = CurrentStatus.getStatusObject(CurrentStatus.STATUS_OUT_OF_SERVICE);
              sendStatusResult(statusData);
              break;
          case IALocationManager.STATUS_TEMPORARILY_UNAVAILABLE:
              statusData = CurrentStatus.getStatusObject(CurrentStatus.STATUS_TEMPORARILY_UNAVAILABLE);
              sendStatusResult(statusData);
              break;
        }
    }

    @Override
    public void onWayfindingUpdate(IARoute route) {
      if (wayfindingUpdateCallbackContext != null) {
          PluginResult pluginResult;
          pluginResult = new PluginResult(PluginResult.Status.OK, getRouteJSONFromIARoute(route));
          //pluginResult.setKeepCallback(true);
          wayfindingUpdateCallbackContext.sendPluginResult(pluginResult);
      }
    }

    private JSONObject getGeojsonFromIaGeofence(IAGeofence iaGeofence) {
        try {
            JSONObject geoJson = new JSONObject();

            JSONObject properties = new JSONObject();
            properties.put("name", iaGeofence.getName());
            properties.put("floor", iaGeofence.getFloor());
            properties.put("payload", iaGeofence.getPayload());
            geoJson.put("properties", properties);

            JSONObject geometry = new JSONObject();
            JSONArray coordinates = new JSONArray();
            JSONArray linearRing = new JSONArray();
            for (double[] iaEdge : iaGeofence.getEdges()) {
                JSONArray vertex = new JSONArray();
                vertex.put(iaEdge[1]);
                vertex.put(iaEdge[0]);
                linearRing.put(vertex);
            }
            geometry.put("type", "Polygon");
            coordinates.put(linearRing);
            geometry.put("coordinates", coordinates);

            geoJson.put("type", "Feature");
            geoJson.put("id", iaGeofence.getId());
            geoJson.put("geometry", geometry);

            return geoJson;
        } catch (JSONException e) {
            throw new IllegalStateException(e.getMessage());
        }
    }

    private JSONObject getPoiJsonFromIaPoi(IAPOI iaPoi) {
        try {
            JSONObject poi = new JSONObject();

            JSONObject properties = new JSONObject();
            properties.put("name", iaPoi.getName());
            properties.put("floor", iaPoi.getFloor());
            properties.put("payload", iaPoi.getPayload());
            poi.put("properties", properties);

            JSONObject geometry = new JSONObject();
            JSONArray coordinates = new JSONArray();
            coordinates.put(iaPoi.getLocation().longitude);
            coordinates.put(iaPoi.getLocation().latitude);
            geometry.put("type", "Point");
            geometry.put("coordinates", coordinates);

            poi.put("type", "Feature");
            poi.put("id", iaPoi.getId());
            poi.put("geometry", geometry);

            return poi;
        } catch (JSONException e) {
            throw new IllegalStateException(e.getMessage());
        }
    }

    // Cordova plugin uses string literals "ENTER" and "EXIT" instead of enums.
    private String geofenceToRegionTransitionType(int geofenceTransitionType) {
        if (geofenceTransitionType == IAGeofence.GEOFENCE_TRANSITION_ENTER) {
            return "ENTER";
        } else if (geofenceTransitionType == IAGeofence.GEOFENCE_TRANSITION_EXIT) {
            return "EXIT";
        } else {
            return "UNKNOWN";
        }
    }

    @Override
    public void onGeofencesTriggered(IAGeofenceEvent event) {
        if (geofenceCallbackContext != null) {
            for (IAGeofence iaGeofence : event.getTriggeringGeofences()) {
                try {
                    String transitionType = geofenceToRegionTransitionType(event.getGeofenceTransition());
                    JSONObject geoJson = getGeojsonFromIaGeofence(iaGeofence);
                    JSONObject result = new JSONObject();
                    result.put("transitionType", transitionType);
                    result.put("geoJson", geoJson);
                    PluginResult pluginResult = new PluginResult(
                        PluginResult.Status.OK,
                        result
                    );
                    //pluginResult.setKeepCallback(true);
                    geofenceCallbackContext.sendPluginResult(pluginResult);
                } catch (JSONException e) {
                    throw new IllegalStateException(e.getMessage());
                }
            }
        }
    }

    @Override
    public void onIBeaconScan​(List<IARadioScan.IBeacon> beacons) {
        if (iBeaconScanCallbackContext != null) {
            try {
                JSONArray scans = new JSONArray();
                for (IARadioScan.IBeacon beacon : beacons) {
                    JSONObject scan = new JSONObject();
                    scan.put("uuid", beacon.uuid.toString().toLowerCase());
                    scan.put("major", beacon.major);
                    scan.put("minor", beacon.minor);
                    scan.put("rssi", beacon.rssi);
                    scans.put(scan);
                }
                JSONObject result = new JSONObject();
                result.put("beacons", scans);
                PluginResult pluginResult = new PluginResult(
                    PluginResult.Status.OK,
                    result
                );
                //pluginResult.setKeepCallback(true);
                iBeaconScanCallbackContext.sendPluginResult(pluginResult);
            } catch (JSONException e) {
                throw new IllegalStateException(e.getMessage());
            }
        }
    }

    @Override
    public void onIBeaconScanError​(int errorCode, String description) {
        if (iBeaconScanCallbackContext != null) {
            try {
                JSONObject details = new JSONObject();
                details.put("errorCode", errorCode);
                JSONObject error = new JSONObject();
                error.put("description", description);
                error.put("details", details);
                JSONObject result = new JSONObject();
                result.put("error", error);
                PluginResult pluginResult = new PluginResult(
                    PluginResult.Status.OK,
                    result
                );
                //pluginResult.setKeepCallback(true);
                iBeaconScanCallbackContext.sendPluginResult(pluginResult);
            } catch (JSONException e) {
                throw new IllegalStateException(e.getMessage());
            }
        }
    }

    @Override
    public void onWifiScan​(List<IARadioScan.Wifi> wifis) {
        if (wifiScanCallbackContext != null) {
            try {
                JSONArray scans = new JSONArray();
                for (IARadioScan.Wifi wifi : wifis) {
                    JSONObject scan = new JSONObject();
                    scan.put("bssid", wifi.bssid);
                    scan.put("rssi", wifi.rssi);
                    scans.put(scan);
                }
                JSONObject result = new JSONObject();
                result.put("wifis", scans);
                PluginResult pluginResult = new PluginResult(
                    PluginResult.Status.OK,
                    result
                );
                //pluginResult.setKeepCallback(true);
                wifiScanCallbackContext.sendPluginResult(pluginResult);
            } catch (JSONException e) {
                throw new IllegalStateException(e.getMessage());
            }
        }
    }

    @Override
    public void onWifiScanError() {
        if (wifiScanCallbackContext != null) {
            try {
                JSONObject error = new JSONObject();
                error.put("description", "wifi scan failed");
                JSONObject result = new JSONObject();
                result.put("error", error);
                PluginResult pluginResult = new PluginResult(
                    PluginResult.Status.OK,
                    result
                );
                //pluginResult.setKeepCallback(true);
                wifiScanCallbackContext.sendPluginResult(pluginResult);
            } catch (JSONException e) {
                throw new IllegalStateException(e.getMessage());
            }
        }
    }
}
