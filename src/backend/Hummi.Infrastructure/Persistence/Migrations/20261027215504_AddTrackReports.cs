using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hummi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddTrackReports : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "TrackReports",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                TrackId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ReporterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Reason = table.Column<int>(type: "int", nullable: false),
                Details = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                Status = table.Column<int>(type: "int", nullable: false),
                Outcome = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                ResolvedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TrackReports", x => x.Id);
                table.ForeignKey(
                    name: "FK_TrackReports_Listeners_ReporterId",
                    column: x => x.ReporterId,
                    principalTable: "Listeners",
                    principalColumn: "Id");
                table.ForeignKey(
                    name: "FK_TrackReports_Tracks_TrackId",
                    column: x => x.TrackId,
                    principalTable: "Tracks",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_TrackReports_ReporterId",
            table: "TrackReports",
            column: "ReporterId");

        migrationBuilder.CreateIndex(
            name: "IX_TrackReports_Status_CreatedAt",
            table: "TrackReports",
            columns: new[] { "Status", "CreatedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_TrackReports_TrackId",
            table: "TrackReports",
            column: "TrackId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "TrackReports");
    }
}
