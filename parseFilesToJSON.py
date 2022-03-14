#!/usr/bin/env python3

import geopandas
#import contextily as cx
import matplotlib.pyplot as plt

#designated_trails_sbn = geopandas.read_file('CPW_Trails/CPWDesignatedTrails02142022.sbn') not recognized as file format
#designated_trails_shx = geopandas.read_file('CPW_Trails/CPWDesignatedTrails02142022.shx')
#designated_trails = designated_trails.to_crs('PROJCS["NAD_1983_UTM_Zone_13N",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-105.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]') 

#trailhead_sbn = geopandas.read_file('CPW_Trails/Trailheads_COTREX02142022.sbn')
#trailhead_shx = geopandas.read_file('CPW_Trails/Trailheads_COTREX02142022.shx')

#trails_sbn = geopandas.read_file('CPW_Trails/Trails_COTREX02142022.sbn')
#trails_shx = geopandas.read_file('CPW_Trails/Trails_COTREX02142022.shx')

# file.columns shows headers
# print(designated_trails.geometry) shows the type of the trail
# LINESTRING (515426.351 4287322.511, 515428.514...
# all designated trailhead data
#print(designated_trails.head().geometry)
#print(co_boundary.head(2))

designated_trails = geopandas.read_file('CPW_Trails/CPWDesignatedTrails02142022.shp')
designated_trails = designated_trails.to_crs(epsg=4326)
designated_trails.to_file('designated_trails.json', driver="GeoJSON")  

trailhead = geopandas.read_file('CPW_Trails/Trailheads_COTREX02142022.shp')
trailhead = designated_trails.to_crs(epsg=4326) #3857
trailhead.to_file('trailhead.json', driver="GeoJSON")  
#print(trailhead.to_json())

trails = geopandas.read_file('CPW_Trails/Trails_COTREX02142022.shp')
trails = trails.to_crs(epsg=4326)
trails.to_file('trails.json', driver="GeoJSON")  
#print(trails.to_json())

#co_boundary = geopandas.read_file('Colorado_State_Boundary/Colorado_State_Boundary.shp')
#co_boundary = co_boundary.to_crs('PROJCS["NAD_1983_UTM_Zone_13N",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-105.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]') 
#co_boundary = co_boundary.to_crs(epsg=3857) 
#co_map = co_boundary.plot(figsize=(15,15), alpha=0.1, facecolor="r", edgecolor="b")
#co_map.axis('off')
#trail_map = designated_trails.plot(ax=co_map, alpha = 0.5, cmap='winter')
#trailhead_map = trailhead.plot(ax=co_map, alpha = 0.5, cmap='Purples')
#trails_map = trails.plot(ax=co_map, cmap='Oranges')
#cx.add_basemap(co_map, zoom=8)
#co_fig = co_map.get_figure()
#co_fig.tight_layout()
#plt.savefig("images/all_trails.png")

#trail_map.set_title("Designated Trails", fontdict={'fontsize': '20', 'fontweight': '2'})
#trail_map.axis('off')
#trail_fig = trail_map.get_figure()
#trail_fig.savefig("trail_map.png")

# only 2 points
#trail_map_n = designated_trails.head(2).plot(figsize=(12,8), alpha=0.5, edgecolor="k")
#trail_n_fig = trail_map_n.get_figure()
#trail_n_fig.savefig("trail_n_map.png")

